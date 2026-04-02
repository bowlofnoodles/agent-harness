import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import { initConfig } from '../config/index.js';

export interface InjectOptions {
  name?: string;
  force?: boolean;
  skipInit?: boolean;
}

export interface DetectedProject {
  name: string;
  framework: 'react' | 'nestjs' | 'vue' | 'next' | 'generic';
  language: 'typescript' | 'javascript';
  hasTailwind: boolean;
  hasRouter: boolean;
  hasDatabase: string;
  hasAuth: boolean;
  hasDocker: boolean;
  testFramework: string;
  buildTool: string;
  scripts: Record<string, string>;
  srcSubdirs: string[];
}

export async function detectProject(
  projectRoot: string,
  overrideName?: string,
): Promise<DetectedProject> {
  const pkgPath = path.join(projectRoot, 'package.json');
  let pkg: Record<string, unknown> = {};
  if (await fs.pathExists(pkgPath)) {
    pkg = await fs.readJson(pkgPath);
  }

  const name =
    overrideName ??
    (typeof pkg.name === 'string' ? pkg.name : path.basename(projectRoot));

  const deps: Record<string, string> = {
    ...((pkg.dependencies as Record<string, string>) ?? {}),
    ...((pkg.devDependencies as Record<string, string>) ?? {}),
  };
  const scripts = (pkg.scripts as Record<string, string>) ?? {};

  // Detect framework (priority order: nestjs > next > react > vue > generic)
  let framework: DetectedProject['framework'] = 'generic';
  if (deps['@nestjs/core']) {
    framework = 'nestjs';
  } else if (deps['next']) {
    framework = 'next';
  } else if (deps['react']) {
    framework = 'react';
  } else if (deps['vue']) {
    framework = 'vue';
  }

  // Detect language
  const hasTypeScript =
    (await fs.pathExists(path.join(projectRoot, 'tsconfig.json'))) ||
    !!deps['typescript'];
  const language: DetectedProject['language'] = hasTypeScript ? 'typescript' : 'javascript';

  // Detect styling / UI features
  const hasTailwind = !!deps['tailwindcss'];
  const hasRouter =
    !!deps['react-router-dom'] ||
    !!deps['react-router'] ||
    !!deps['vue-router'] ||
    !!deps['@angular/router'];

  // Detect auth
  const hasAuth =
    !!deps['@nestjs/passport'] ||
    !!deps['passport'] ||
    !!deps['jsonwebtoken'] ||
    !!deps['next-auth'] ||
    !!deps['@auth/core'];

  // Detect Docker
  const hasDocker = await fs.pathExists(path.join(projectRoot, 'Dockerfile'));

  // Detect database ORM/client
  let hasDatabase = 'none';
  if (deps['@prisma/client'] || deps['prisma']) {
    hasDatabase = 'Prisma';
  } else if (deps['mongoose']) {
    hasDatabase = 'Mongoose';
  } else if (deps['typeorm']) {
    hasDatabase = 'TypeORM';
  } else if (deps['sequelize']) {
    hasDatabase = 'Sequelize';
  } else if (deps['drizzle-orm']) {
    hasDatabase = 'Drizzle ORM';
  }

  // Detect test framework
  let testFramework = 'none';
  if (deps['vitest']) {
    testFramework = 'vitest';
  } else if (deps['jest'] || deps['@jest/globals']) {
    testFramework = 'jest';
  } else if (deps['mocha']) {
    testFramework = 'mocha';
  }

  // Detect build tool
  let buildTool = 'none';
  if (deps['vite']) {
    buildTool = 'vite';
  } else if (deps['webpack'] || deps['webpack-cli']) {
    buildTool = 'webpack';
  } else if (deps['esbuild']) {
    buildTool = 'esbuild';
  } else if (deps['rollup']) {
    buildTool = 'rollup';
  }

  // Scan src/ subdirectories for structure hints
  const srcSubdirs: string[] = [];
  const srcDir = path.join(projectRoot, 'src');
  if (await fs.pathExists(srcDir)) {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        srcSubdirs.push(entry.name);
      }
    }
  }

  return {
    name,
    framework,
    language,
    hasTailwind,
    hasRouter,
    hasDatabase,
    hasAuth,
    hasDocker,
    testFramework,
    buildTool,
    scripts,
    srcSubdirs,
  };
}

export function getFrameworkLabel(project: DetectedProject): string {
  switch (project.framework) {
    case 'react':
      return `React${project.buildTool === 'vite' ? ' + Vite' : ''}`;
    case 'nestjs':
      return 'Nest.js';
    case 'vue':
      return `Vue${project.buildTool === 'vite' ? ' + Vite' : ''}`;
    case 'next':
      return 'Next.js';
    default:
      return 'Node.js';
  }
}

export function generateClaudeMd(project: DetectedProject): string {
  const lang = project.language === 'typescript' ? 'TypeScript' : 'JavaScript';
  const framework = getFrameworkLabel(project);

  const overviewLines = [
    `- **Framework**: ${framework} + ${lang}`,
    project.hasTailwind ? '- **Styling**: Tailwind CSS' : null,
    project.hasRouter ? '- **Routing**: Client-side router included' : null,
    project.hasDatabase !== 'none'
      ? `- **Database**: ${project.hasDatabase === 'Prisma' ? 'Prisma ORM' : project.hasDatabase}`
      : null,
    project.hasAuth ? '- **Auth**: Authentication configured' : null,
  ]
    .filter(Boolean)
    .join('\n');

  const structureLines =
    project.srcSubdirs.length > 0
      ? `src/\n${project.srcSubdirs.map(d => `├── ${d}/`).join('\n')}`
      : 'src/\n├── (project source files)';

  const RELEVANT_SCRIPTS = ['dev', 'start', 'start:dev', 'build', 'test', 'lint', 'preview'];
  const scriptRows = Object.entries(project.scripts)
    .filter(([k]) => RELEVANT_SCRIPTS.includes(k))
    .map(([k, v]) => `| \`npm run ${k}\` | \`${v}\` |`)
    .join('\n');
  const commandsTable = scriptRows
    ? `| Command | Script |\n|---------|--------|\n${scriptRows}`
    : '| `npm run dev` | Start development server |\n| `npm run build` | Build for production |';

  const conventionsByFramework: Record<string, string> = {
    react: [
      '- Use functional components with hooks',
      '- Place reusable components in `src/components/`',
      '- Place page components in `src/pages/`',
      '- Custom hooks in `src/hooks/` (prefix with `use`)',
      project.hasTailwind ? '- Use Tailwind utility classes; avoid custom CSS when possible' : '',
      project.hasRouter ? '- Add new routes using the router configuration' : '',
    ]
      .filter(Boolean)
      .join('\n'),

    nestjs: [
      '- Every feature lives in its own **module** folder (e.g. `src/users/`)',
      '- Use **DTOs** with `class-validator` decorators for input validation',
      '- Use **Guards** for authentication/authorization',
      '- Business logic belongs in **services**, not controllers',
      '- Write tests alongside source files as `*.spec.ts`',
      project.hasDatabase === 'Prisma'
        ? '- Run `npx prisma migrate dev` after schema changes'
        : '',
    ]
      .filter(Boolean)
      .join('\n'),

    vue: [
      '- Use the Composition API with `<script setup>`',
      '- Place reusable components in `src/components/`',
      '- Place page components in `src/views/` or `src/pages/`',
      project.hasRouter ? '- Add new routes in the router configuration' : '',
      project.hasTailwind ? '- Use Tailwind utility classes' : '',
    ]
      .filter(Boolean)
      .join('\n'),

    next: [
      '- Pages go in `app/` (App Router) or `pages/` (Pages Router)',
      '- Use Server Components by default; add `"use client"` only when necessary',
      project.hasDatabase !== 'none'
        ? `- Database access via ${project.hasDatabase}`
        : '',
      project.hasAuth ? '- Authentication is configured' : '',
    ]
      .filter(Boolean)
      .join('\n'),

    generic: [
      '- Follow the existing code conventions in the project',
      '- Check existing files for patterns before adding new code',
      '- Keep changes focused and minimal',
    ].join('\n'),
  };

  const conventions =
    conventionsByFramework[project.framework] ?? conventionsByFramework['generic'];

  return `# CLAUDE.md — AI Agent Instructions for ${project.name}

This file provides context for Claude Code and other AI coding agents working on this project.

> Generated by \`agent-harness inject\`. Update this file to reflect your actual project conventions.

## Project Overview

${overviewLines}

## Project Structure

\`\`\`
${structureLines}
\`\`\`

## Commands

${commandsTable}

## Conventions

${conventions}
`;
}

export function generateCopilotInstructions(project: DetectedProject): string {
  const lang = project.language === 'typescript' ? 'TypeScript' : 'JavaScript';
  const framework = getFrameworkLabel(project);

  const architectureByFramework: Record<string, string> = {
    react: [
      '- Prefer functional components over class components',
      '- Use named exports for components',
      '- Use `interface` for component props',
      project.hasTailwind
        ? '- No inline styles — use Tailwind utility classes'
        : '- No inline styles — use CSS modules',
      '- Keep components small and focused',
      '- Extract reusable logic into custom hooks',
    ]
      .filter(Boolean)
      .join('\n'),

    nestjs: [
      '- Each feature = 1 module with its own controller, service, DTOs, and entities',
      '- Business logic belongs in **services**, not controllers',
      '- Controllers handle HTTP concerns only (request/response)',
      '- Use **guards** for auth, **interceptors** for cross-cutting concerns',
      '- Use **pipes** for input validation/transformation',
    ].join('\n'),

    vue: [
      '- Use Composition API with `<script setup>` syntax',
      '- Use typed props with `defineProps`',
      '- Extract reusable logic into composables (`use*.ts`)',
      project.hasTailwind ? '- Use Tailwind utility classes for styling' : '',
    ]
      .filter(Boolean)
      .join('\n'),

    next: [
      '- Prefer Server Components; use `"use client"` only when necessary',
      '- Keep data fetching in server components or API routes',
      `- Use ${lang} for all new files`,
    ].join('\n'),

    generic: [
      '- Follow the patterns established in existing code',
      `- Write ${lang} using modern syntax and idioms`,
      '- Add tests for new functionality',
    ].join('\n'),
  };

  const databaseSection =
    project.hasDatabase !== 'none'
      ? `\n## Database\n\n- ORM/ODM: ${project.hasDatabase}\n- Follow existing schema and migration patterns\n`
      : '';

  const authSection = project.hasAuth
    ? `\n## Authentication\n\n- Auth is configured in this project\n- Follow existing patterns for protected routes/endpoints\n`
    : '';

  const testingSection =
    project.testFramework !== 'none'
      ? `\n## Testing\n\n- Test framework: ${project.testFramework}\n- Write tests for all new features and bug fixes\n`
      : '';

  const architecture =
    architectureByFramework[project.framework] ?? architectureByFramework['generic'];

  return `# Copilot Instructions for ${project.name}

> Generated by \`agent-harness inject\`. Update this file to reflect your actual project rules.

## Project Context

${framework} + ${lang} project.

## Code Style

- Use ${lang}${project.language === 'typescript' ? ' strict mode' : ' modern ES syntax'}
- Follow existing naming conventions in the codebase
${architecture}${databaseSection}${authSection}${testingSection}`;
}

export async function injectCommand(options: InjectOptions): Promise<void> {
  const projectRoot = process.cwd();

  console.log(chalk.blue('\n💉 Agent Harness — Inject into Existing Project\n'));

  try {
    // Detect project
    console.log(chalk.gray('  Analyzing project...\n'));
    const project = await detectProject(projectRoot, options.name);

    console.log(chalk.white('  Detected:'));
    console.log(chalk.gray(`    Name:      ${project.name}`));
    console.log(chalk.gray(`    Framework: ${getFrameworkLabel(project)}`));
    console.log(chalk.gray(`    Language:  ${project.language}`));
    if (project.hasTailwind) console.log(chalk.gray('    Tailwind:  yes'));
    if (project.hasDatabase !== 'none')
      console.log(chalk.gray(`    Database:  ${project.hasDatabase}`));
    if (project.hasAuth) console.log(chalk.gray('    Auth:      yes'));
    if (project.testFramework !== 'none')
      console.log(chalk.gray(`    Tests:     ${project.testFramework}`));
    if (project.hasDocker) console.log(chalk.gray('    Docker:    yes'));
    console.log('');

    // Check for existing AI instruction files
    const claudePath = path.join(projectRoot, 'CLAUDE.md');
    const copilotPath = path.join(projectRoot, '.github', 'copilot-instructions.md');
    const claudeExists = await fs.pathExists(claudePath);
    const copilotExists = await fs.pathExists(copilotPath);

    if ((claudeExists || copilotExists) && !options.force) {
      const existing: string[] = [];
      if (claudeExists) existing.push('CLAUDE.md');
      if (copilotExists) existing.push('.github/copilot-instructions.md');

      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `The following files already exist: ${existing.join(', ')}. Overwrite?`,
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('\n⚠️  Injection skipped — no files were overwritten.'));
        return;
      }
    }

    // Initialize harness if not already done
    if (!options.skipInit) {
      const configPath = path.join(projectRoot, '.harness.yaml');
      if (!(await fs.pathExists(configPath))) {
        console.log(chalk.gray('  Initializing Agent Harness config...\n'));
        const config = await initConfig(projectRoot);
        config.projectName = project.name;
        const harnessDir = path.join(projectRoot, '.harness');
        await fs.ensureDir(harnessDir);
        const memoryPath = path.join(harnessDir, 'memory.json');
        if (!(await fs.pathExists(memoryPath))) {
          await fs.writeFile(memoryPath, '[]', 'utf-8');
        }
      }
    }

    // Generate AI instruction files
    const filesCreated: string[] = [];

    const claudeContent = generateClaudeMd(project);
    await fs.writeFile(claudePath, claudeContent, 'utf-8');
    filesCreated.push('CLAUDE.md');

    await fs.ensureDir(path.join(projectRoot, '.github'));
    const copilotContent = generateCopilotInstructions(project);
    await fs.writeFile(copilotPath, copilotContent, 'utf-8');
    filesCreated.push('.github/copilot-instructions.md');

    console.log(chalk.green('✅ Injection complete!\n'));
    console.log(chalk.white('  Files created/updated:'));
    for (const f of filesCreated) {
      console.log(chalk.gray(`    ${f}`));
    }

    console.log(chalk.white('\n  Next steps:'));
    console.log(chalk.cyan('    1. Review and customize CLAUDE.md with your project conventions'));
    console.log(
      chalk.cyan('    2. Review and customize .github/copilot-instructions.md'),
    );
    console.log(chalk.cyan('    3. Start using AI agents: Claude / Copilot / Cursor'));
    console.log(chalk.cyan('    4. Run `agent-harness run` to start the agent loop'));
    console.log('');
  } catch (error) {
    if ((error as Record<string, unknown>).isTtyError) {
      console.error(
        chalk.red('\n❌ Interactive prompts not supported in this environment.'),
      );
      console.log(chalk.gray('   Use --force to skip confirmation prompts.'));
    } else {
      console.error(
        chalk.red(
          `\n❌ Injection failed: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
    process.exit(1);
  }
}

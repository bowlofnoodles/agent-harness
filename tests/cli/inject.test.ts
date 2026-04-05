import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectProject,
  generateClaudeMd,
  generateCopilotInstructions,
  getFrameworkLabel,
  type DetectedProject,
} from '../../src/cli/inject.js';
import fs from 'fs-extra';
import path from 'path';

const TEST_DIR = '/tmp/test-inject-output';

describe('detectProject', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('should detect React project', async () => {
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), {
      name: 'my-react-app',
      dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
      devDependencies: {
        typescript: '^5.0.0',
        vite: '^5.0.0',
        tailwindcss: '^3.0.0',
        'react-router-dom': '^6.0.0',
      },
    });
    await fs.writeFile(path.join(TEST_DIR, 'tsconfig.json'), '{}');

    const project = await detectProject(TEST_DIR);

    expect(project.framework).toBe('react');
    expect(project.language).toBe('typescript');
    expect(project.hasTailwind).toBe(true);
    expect(project.hasRouter).toBe(true);
    expect(project.buildTool).toBe('vite');
  });

  it('should detect Nest.js project with prisma and auth', async () => {
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), {
      name: 'my-api',
      dependencies: {
        '@nestjs/core': '^10.0.0',
        '@nestjs/passport': '^10.0.0',
        '@prisma/client': '^5.0.0',
      },
      devDependencies: { vitest: '^1.0.0' },
    });

    const project = await detectProject(TEST_DIR);

    expect(project.framework).toBe('nestjs');
    expect(project.hasAuth).toBe(true);
    expect(project.hasDatabase).toBe('Prisma');
    expect(project.testFramework).toBe('vitest');
  });

  it('should detect Vue project', async () => {
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), {
      name: 'my-vue-app',
      dependencies: { vue: '^3.0.0', 'vue-router': '^4.0.0' },
      devDependencies: { vite: '^5.0.0' },
    });

    const project = await detectProject(TEST_DIR);

    expect(project.framework).toBe('vue');
    expect(project.hasRouter).toBe(true);
    expect(project.buildTool).toBe('vite');
  });

  it('should detect Next.js project', async () => {
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), {
      name: 'my-next-app',
      dependencies: { next: '^14.0.0', react: '^18.0.0', 'next-auth': '^4.0.0' },
    });

    const project = await detectProject(TEST_DIR);

    expect(project.framework).toBe('next');
    expect(project.hasAuth).toBe(true);
  });

  it('should fall back to generic when no known framework found', async () => {
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), {
      name: 'my-tool',
      dependencies: { chalk: '^5.0.0' },
    });

    const project = await detectProject(TEST_DIR);

    expect(project.framework).toBe('generic');
  });

  it('should use override name when provided', async () => {
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), {
      name: 'original-name',
      dependencies: {},
    });

    const project = await detectProject(TEST_DIR, 'override-name');

    expect(project.name).toBe('override-name');
  });

  it('should fall back to directory name when no package.json', async () => {
    const project = await detectProject(TEST_DIR);

    expect(project.name).toBe(path.basename(TEST_DIR));
    expect(project.framework).toBe('generic');
  });

  it('should detect database ORMs correctly', async () => {
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), {
      name: 'my-app',
      dependencies: { mongoose: '^8.0.0' },
    });

    const project = await detectProject(TEST_DIR);
    expect(project.hasDatabase).toBe('Mongoose');
  });

  it('should detect Dockerfile', async () => {
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), { name: 'my-app', dependencies: {} });
    await fs.writeFile(path.join(TEST_DIR, 'Dockerfile'), 'FROM node:20');

    const project = await detectProject(TEST_DIR);
    expect(project.hasDocker).toBe(true);
  });

  it('should scan src subdirectories', async () => {
    await fs.ensureDir(path.join(TEST_DIR, 'src', 'components'));
    await fs.ensureDir(path.join(TEST_DIR, 'src', 'hooks'));
    await fs.ensureDir(path.join(TEST_DIR, 'src', 'pages'));

    const project = await detectProject(TEST_DIR);

    expect(project.srcSubdirs).toContain('components');
    expect(project.srcSubdirs).toContain('hooks');
    expect(project.srcSubdirs).toContain('pages');
  });

  it('should detect JavaScript project (no tsconfig)', async () => {
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), {
      name: 'my-js-app',
      dependencies: { react: '^18.0.0' },
    });

    const project = await detectProject(TEST_DIR);
    expect(project.language).toBe('javascript');
  });

  it('should capture scripts from package.json', async () => {
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), {
      name: 'my-app',
      scripts: { dev: 'vite', build: 'vite build', test: 'vitest' },
      dependencies: { react: '^18.0.0' },
    });

    const project = await detectProject(TEST_DIR);
    expect(project.scripts['dev']).toBe('vite');
    expect(project.scripts['build']).toBe('vite build');
  });
});

describe('getFrameworkLabel', () => {
  it('should return React + Vite for react with vite', () => {
    const p = { framework: 'react', buildTool: 'vite' } as DetectedProject;
    expect(getFrameworkLabel(p)).toBe('React + Vite');
  });

  it('should return React for react without vite', () => {
    const p = { framework: 'react', buildTool: 'webpack' } as DetectedProject;
    expect(getFrameworkLabel(p)).toBe('React');
  });

  it('should return Nest.js for nestjs', () => {
    const p = { framework: 'nestjs', buildTool: 'none' } as DetectedProject;
    expect(getFrameworkLabel(p)).toBe('Nest.js');
  });

  it('should return Node.js for generic', () => {
    const p = { framework: 'generic', buildTool: 'none' } as DetectedProject;
    expect(getFrameworkLabel(p)).toBe('Node.js');
  });
});

describe('generateClaudeMd', () => {
  it('should include project name in the output', () => {
    const project: DetectedProject = {
      name: 'awesome-project',
      framework: 'react',
      language: 'typescript',
      hasTailwind: false,
      hasRouter: false,
      hasDatabase: 'none',
      hasAuth: false,
      hasDocker: false,
      testFramework: 'none',
      buildTool: 'vite',
      scripts: { dev: 'vite', build: 'vite build' },
      srcSubdirs: [],
    };

    const content = generateClaudeMd(project);
    expect(content).toContain('awesome-project');
    expect(content).toContain('CLAUDE.md');
    expect(content).toContain('React + Vite');
    expect(content).toContain('TypeScript');
  });

  it('should include Tailwind convention when detected', () => {
    const project: DetectedProject = {
      name: 'tailwind-app',
      framework: 'react',
      language: 'typescript',
      hasTailwind: true,
      hasRouter: false,
      hasDatabase: 'none',
      hasAuth: false,
      hasDocker: false,
      testFramework: 'none',
      buildTool: 'vite',
      scripts: {},
      srcSubdirs: [],
    };

    const content = generateClaudeMd(project);
    expect(content).toContain('Tailwind');
  });

  it('should include database info when present', () => {
    const project: DetectedProject = {
      name: 'db-app',
      framework: 'nestjs',
      language: 'typescript',
      hasTailwind: false,
      hasRouter: false,
      hasDatabase: 'Prisma',
      hasAuth: true,
      hasDocker: false,
      testFramework: 'vitest',
      buildTool: 'none',
      scripts: { 'start:dev': 'nest start --watch' },
      srcSubdirs: ['modules', 'common'],
    };

    const content = generateClaudeMd(project);
    expect(content).toContain('Prisma ORM');
    expect(content).toContain('Authentication');
    expect(content).toContain('modules/');
    expect(content).toContain('common/');
  });

  it('should include the inject attribution note', () => {
    const project: DetectedProject = {
      name: 'my-project',
      framework: 'generic',
      language: 'javascript',
      hasTailwind: false,
      hasRouter: false,
      hasDatabase: 'none',
      hasAuth: false,
      hasDocker: false,
      testFramework: 'none',
      buildTool: 'none',
      scripts: {},
      srcSubdirs: [],
    };

    const content = generateClaudeMd(project);
    expect(content).toContain('agent-harness inject');
  });

  it('should list scripts in the commands section', () => {
    const project: DetectedProject = {
      name: 'script-app',
      framework: 'react',
      language: 'typescript',
      hasTailwind: false,
      hasRouter: false,
      hasDatabase: 'none',
      hasAuth: false,
      hasDocker: false,
      testFramework: 'jest',
      buildTool: 'vite',
      scripts: { dev: 'vite', build: 'vite build', test: 'jest' },
      srcSubdirs: [],
    };

    const content = generateClaudeMd(project);
    expect(content).toContain('npm run dev');
    expect(content).toContain('npm run build');
    expect(content).toContain('npm run test');
  });
});

describe('generateCopilotInstructions', () => {
  it('should include project name and framework context', () => {
    const project: DetectedProject = {
      name: 'my-api',
      framework: 'nestjs',
      language: 'typescript',
      hasTailwind: false,
      hasRouter: false,
      hasDatabase: 'Prisma',
      hasAuth: true,
      hasDocker: false,
      testFramework: 'jest',
      buildTool: 'none',
      scripts: {},
      srcSubdirs: [],
    };

    const content = generateCopilotInstructions(project);
    expect(content).toContain('my-api');
    expect(content).toContain('Nest.js');
    expect(content).toContain('TypeScript');
    expect(content).toContain('agent-harness inject');
  });

  it('should include database section when database is present', () => {
    const project: DetectedProject = {
      name: 'my-app',
      framework: 'nestjs',
      language: 'typescript',
      hasTailwind: false,
      hasRouter: false,
      hasDatabase: 'Mongoose',
      hasAuth: false,
      hasDocker: false,
      testFramework: 'none',
      buildTool: 'none',
      scripts: {},
      srcSubdirs: [],
    };

    const content = generateCopilotInstructions(project);
    expect(content).toContain('Database');
    expect(content).toContain('Mongoose');
  });

  it('should include auth section when auth is present', () => {
    const project: DetectedProject = {
      name: 'my-app',
      framework: 'react',
      language: 'typescript',
      hasTailwind: false,
      hasRouter: false,
      hasDatabase: 'none',
      hasAuth: true,
      hasDocker: false,
      testFramework: 'none',
      buildTool: 'none',
      scripts: {},
      srcSubdirs: [],
    };

    const content = generateCopilotInstructions(project);
    expect(content).toContain('Authentication');
  });

  it('should include testing section when test framework is present', () => {
    const project: DetectedProject = {
      name: 'my-app',
      framework: 'vue',
      language: 'typescript',
      hasTailwind: false,
      hasRouter: false,
      hasDatabase: 'none',
      hasAuth: false,
      hasDocker: false,
      testFramework: 'vitest',
      buildTool: 'vite',
      scripts: {},
      srcSubdirs: [],
    };

    const content = generateCopilotInstructions(project);
    expect(content).toContain('Testing');
    expect(content).toContain('vitest');
  });

  it('should not include empty sections when features are absent', () => {
    const project: DetectedProject = {
      name: 'minimal-app',
      framework: 'generic',
      language: 'javascript',
      hasTailwind: false,
      hasRouter: false,
      hasDatabase: 'none',
      hasAuth: false,
      hasDocker: false,
      testFramework: 'none',
      buildTool: 'none',
      scripts: {},
      srcSubdirs: [],
    };

    const content = generateCopilotInstructions(project);
    expect(content).not.toContain('## Database');
    expect(content).not.toContain('## Authentication');
    expect(content).not.toContain('## Testing');
  });
});

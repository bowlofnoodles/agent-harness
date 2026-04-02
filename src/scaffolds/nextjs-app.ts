import path from 'path';
import fs from 'fs-extra';
import type { ScaffoldConfig, ScaffoldResult } from '../types.js';
import { BaseScaffold } from './base-scaffold.js';
import { logger } from '../utils/logger.js';

/**
 * NextjsScaffold - Generates a modern Next.js 14+ App Router fullstack project.
 */
export class NextjsScaffold extends BaseScaffold {
  readonly config: ScaffoldConfig = {
    name: 'nextjs',
    description: 'Next.js 14+ App Router fullstack application with TypeScript',
    type: 'fullstack',
    options: [
      { name: 'projectName', description: 'Project name', type: 'string', required: true },
      { name: 'useTailwind', description: 'Use Tailwind CSS', type: 'boolean', default: true, required: false },
      { name: 'useDatabase', description: 'Database type', type: 'select', choices: ['prisma-postgres', 'drizzle-postgres', 'none'], default: 'prisma-postgres', required: false },
      { name: 'useAuth', description: 'Include NextAuth.js', type: 'boolean', default: true, required: false },
    ],
  };

  async generate(targetDir: string, options: Record<string, unknown>): Promise<ScaffoldResult> {
    const projectName = (options.projectName as string | undefined) ?? 'my-nextjs-app';
    const useTailwind = (options.useTailwind as boolean | undefined) ?? true;
    const useDatabase = (options.useDatabase as string | undefined) ?? 'prisma-postgres';
    const useAuth = (options.useAuth as boolean | undefined) ?? true;

    const projectDir = path.join(targetDir, projectName);
    const filesCreated: string[] = [];
    const commands: string[] = [];

    try {
      // Create directory structure
      await fs.ensureDir(path.join(projectDir, 'src', 'app', 'api', 'health'));
      await fs.ensureDir(path.join(projectDir, 'src', 'components', 'ui'));
      await fs.ensureDir(path.join(projectDir, 'src', 'lib'));
      await fs.ensureDir(path.join(projectDir, 'src', 'hooks'));
      await fs.ensureDir(path.join(projectDir, 'src', 'types'));
      await fs.ensureDir(path.join(projectDir, 'public'));

      // package.json
      const pkgJson = this.generatePackageJson(projectName, useTailwind, useDatabase, useAuth);
      await this.writeFile(projectDir, 'package.json', JSON.stringify(pkgJson, null, 2), filesCreated);

      // tsconfig.json
      await this.writeFile(projectDir, 'tsconfig.json', this.getTsConfig(), filesCreated);

      // next.config.ts
      await this.writeFile(projectDir, 'next.config.ts', this.getNextConfig(), filesCreated);

      // src/app/layout.tsx
      await this.writeFile(projectDir, 'src/app/layout.tsx', this.getLayout(projectName, useTailwind), filesCreated);

      // src/app/page.tsx
      await this.writeFile(projectDir, 'src/app/page.tsx', this.getHomePage(), filesCreated);

      // src/app/globals.css
      await this.writeFile(projectDir, 'src/app/globals.css', this.getGlobalCss(useTailwind), filesCreated);

      // src/app/api/health/route.ts
      await this.writeFile(projectDir, 'src/app/api/health/route.ts', this.getHealthApi(), filesCreated);

      // src/lib/utils.ts
      await this.writeFile(projectDir, 'src/lib/utils.ts', this.getUtils(), filesCreated);

      // .env.local.example
      await this.writeFile(projectDir, '.env.local.example', this.getEnvExample(useDatabase, useAuth), filesCreated);

      // .gitignore
      await this.writeFile(projectDir, '.gitignore', this.getGitignore(), filesCreated);

      // Tailwind config
      if (useTailwind) {
        await this.writeFile(projectDir, 'tailwind.config.ts', this.getTailwindConfig(), filesCreated);
        await this.writeFile(projectDir, 'postcss.config.mjs', this.getPostcssConfig(), filesCreated);
      }

      // Database setup
      if (useDatabase.startsWith('prisma')) {
        await fs.ensureDir(path.join(projectDir, 'prisma'));
        await this.writeFile(projectDir, 'prisma/schema.prisma', this.getPrismaSchema(useDatabase, useAuth), filesCreated);
        await this.writeFile(projectDir, 'src/lib/db.ts', this.getPrismaClient(), filesCreated);
      }

      commands.push(`cd ${projectName} && npm install`);
      commands.push('cp .env.local.example .env.local');
      if (useDatabase.startsWith('prisma')) {
        commands.push('npx prisma generate');
        commands.push('npx prisma db push');
      }
      commands.push('npm run dev');

      logger.info(`Next.js scaffold generated: ${filesCreated.length} files`);

      return this.successResult(filesCreated, commands, [
        `cd ${projectName}`,
        'npm install',
        'cp .env.local.example .env.local',
        ...(useDatabase.startsWith('prisma') ? ['npx prisma generate', 'npx prisma db push'] : []),
        'npm run dev',
        'Open http://localhost:3000 in your browser',
      ]);
    } catch (error) {
      return this.failureResult([`Failed to generate Next.js scaffold: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }

  private async writeFile(baseDir: string, relativePath: string, content: string, tracker: string[]): Promise<void> {
    const fullPath = path.join(baseDir, relativePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
    tracker.push(relativePath);
  }

  private generatePackageJson(name: string, tailwind: boolean, db: string, auth: boolean) {
    const deps: Record<string, string> = {
      next: '^14.2.0',
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    };
    const devDeps: Record<string, string> = {
      '@types/node': '^20.16.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      typescript: '^5.5.0',
      eslint: '^8.57.0',
      'eslint-config-next': '^14.2.0',
    };

    if (tailwind) {
      devDeps['tailwindcss'] = '^3.4.0';
      devDeps['postcss'] = '^8.4.0';
      devDeps['autoprefixer'] = '^10.4.0';
    }
    if (db.startsWith('prisma')) {
      deps['@prisma/client'] = '^5.19.0';
      devDeps['prisma'] = '^5.19.0';
    }
    if (auth) {
      deps['next-auth'] = '^4.24.0';
    }

    return {
      name,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: deps,
      devDependencies: devDeps,
    };
  }

  private getTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./src/*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    }, null, 2);
  }

  private getNextConfig(): string {
    return `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
`;
  }

  private getLayout(title: string, tailwind: boolean): string {
    return `import type { Metadata } from 'next';
${tailwind ? "import './globals.css';" : ''}

export const metadata: Metadata = {
  title: '${title}',
  description: 'Generated by Agent Harness',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
  }

  private getHomePage(): string {
    return `export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Welcome</h1>
      <p className="text-lg text-gray-600">
        Your full-stack application is ready. Start building!
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/api/health"
          className="p-4 border rounded-lg hover:bg-gray-50 transition"
        >
          <h2 className="text-xl font-semibold">API Health →</h2>
          <p className="text-gray-500">Check the API health endpoint</p>
        </a>
      </div>
    </main>
  );
}
`;
  }

  private getGlobalCss(tailwind: boolean): string {
    if (tailwind) {
      return `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
    }
    return `* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html, body {
  max-width: 100vw;
  overflow-x: hidden;
}
`;
  }

  private getHealthApi(): string {
    return `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
`;
  }

  private getUtils(): string {
    return `import { type ClassValue, clsx } from 'clsx';

/** Merge class names conditionally */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
`;
  }

  private getEnvExample(db: string, auth: boolean): string {
    let env = '';
    if (db === 'prisma-postgres' || db === 'drizzle-postgres') {
      env += `DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"\n`;
    }
    if (auth) {
      env += `NEXTAUTH_URL="http://localhost:3000"\n`;
      env += `NEXTAUTH_SECRET="your-secret-key"\n`;
    }
    return env || '# Add your environment variables here\n';
  }

  private getGitignore(): string {
    return `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*

# local env
.env*.local
.env

# typescript
*.tsbuildinfo
next-env.d.ts
`;
  }

  private getTailwindConfig(): string {
    return `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`;
  }

  private getPostcssConfig(): string {
    return `const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
`;
  }

  private getPrismaSchema(db: string, auth: boolean): string {
    const provider = db === 'prisma-postgres' ? 'postgresql' : 'sqlite';
    let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}
`;
    if (auth) {
      schema += `
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
    }
    return schema;
  }

  private getPrismaClient(): string {
    return `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
`;
  }
}

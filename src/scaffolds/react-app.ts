import path from 'path';
import fs from 'fs-extra';
import type { ScaffoldConfig, ScaffoldResult } from '../types.js';
import { BaseScaffold } from './base-scaffold.js';
import { logger } from '../utils/logger.js';

/**
 * ReactScaffold - Generates a modern React + TypeScript + Vite project.
 */
export class ReactScaffold extends BaseScaffold {
  readonly config: ScaffoldConfig = {
    name: 'react',
    description: 'React + TypeScript + Vite frontend application',
    type: 'frontend',
    options: [
      { name: 'projectName', description: 'Project name', type: 'string', required: true },
      { name: 'useTailwind', description: 'Use Tailwind CSS', type: 'boolean', default: true, required: false },
      { name: 'useRouter', description: 'Use React Router', type: 'boolean', default: true, required: false },
      { name: 'stateManager', description: 'State management', type: 'select', choices: ['zustand', 'redux', 'none'], default: 'zustand', required: false },
    ],
  };

  async generate(targetDir: string, options: Record<string, unknown>): Promise<ScaffoldResult> {
    const projectName = options.projectName as string ?? 'my-react-app';
    const useTailwind = options.useTailwind as boolean ?? true;
    const useRouter = options.useRouter as boolean ?? true;

    const projectDir = path.join(targetDir, projectName);
    const filesCreated: string[] = [];
    const commands: string[] = [];

    try {
      await fs.ensureDir(path.join(projectDir, 'src', 'components'));
      await fs.ensureDir(path.join(projectDir, 'src', 'hooks'));
      await fs.ensureDir(path.join(projectDir, 'src', 'pages'));
      await fs.ensureDir(path.join(projectDir, 'src', 'styles'));
      await fs.ensureDir(path.join(projectDir, 'src', 'utils'));
      await fs.ensureDir(path.join(projectDir, 'public'));

      // package.json
      const pkgJson = this.generatePackageJson(projectName, useTailwind, useRouter, options.stateManager as string);
      await this.writeFile(projectDir, 'package.json', JSON.stringify(pkgJson, null, 2), filesCreated);

      // tsconfig.json
      await this.writeFile(projectDir, 'tsconfig.json', this.getTsConfig(), filesCreated);

      // vite.config.ts
      await this.writeFile(projectDir, 'vite.config.ts', this.getViteConfig(), filesCreated);

      // index.html
      await this.writeFile(projectDir, 'index.html', this.getIndexHtml(projectName), filesCreated);

      // src/main.tsx
      await this.writeFile(projectDir, 'src/main.tsx', this.getMainTsx(), filesCreated);

      // src/App.tsx
      await this.writeFile(projectDir, 'src/App.tsx', this.getAppTsx(useRouter), filesCreated);

      // src/styles/globals.css
      await this.writeFile(projectDir, 'src/styles/globals.css', this.getGlobalCss(useTailwind), filesCreated);

      // .gitignore
      await this.writeFile(projectDir, '.gitignore', this.getGitignore(), filesCreated);

      // .eslintrc.cjs
      await this.writeFile(projectDir, '.eslintrc.cjs', this.getEslintConfig(), filesCreated);

      commands.push(`cd ${projectName} && npm install`);
      commands.push('npm run dev');

      logger.info(`React scaffold generated: ${filesCreated.length} files`);

      return this.successResult(filesCreated, commands, [
        `cd ${projectName}`,
        'npm install',
        'npm run dev',
        'Open http://localhost:5173 in your browser',
      ]);
    } catch (error) {
      return this.failureResult([`Failed to generate React scaffold: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }

  private async writeFile(baseDir: string, relativePath: string, content: string, tracker: string[]): Promise<void> {
    const fullPath = path.join(baseDir, relativePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
    tracker.push(relativePath);
  }

  private generatePackageJson(name: string, tailwind: boolean, router: boolean, stateManager: string) {
    const deps: Record<string, string> = { react: '^18.3.0', 'react-dom': '^18.3.0' };
    const devDeps: Record<string, string> = {
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      '@vitejs/plugin-react': '^4.3.0',
      typescript: '^5.5.0',
      vite: '^5.4.0',
      eslint: '^8.57.0',
      '@typescript-eslint/eslint-plugin': '^7.0.0',
      '@typescript-eslint/parser': '^7.0.0',
    };

    if (tailwind) {
      devDeps['tailwindcss'] = '^3.4.0';
      devDeps['postcss'] = '^8.4.0';
      devDeps['autoprefixer'] = '^10.4.0';
    }
    if (router) deps['react-router-dom'] = '^6.26.0';
    if (stateManager === 'zustand') deps['zustand'] = '^4.5.0';
    if (stateManager === 'redux') {
      deps['@reduxjs/toolkit'] = '^2.2.0';
      deps['react-redux'] = '^9.1.0';
    }

    return {
      name,
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
        lint: 'eslint src/ --ext .ts,.tsx',
      },
      dependencies: deps,
      devDependencies: devDeps,
    };
  }

  private getTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        baseUrl: '.',
        paths: { '@/*': ['./src/*'] },
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }],
    }, null, 2);
  }

  private getViteConfig(): string {
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
`;
  }

  private getIndexHtml(title: string): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  }

  private getMainTsx(): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;
  }

  private getAppTsx(useRouter: boolean): string {
    if (useRouter) {
      return `import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">Welcome to Your App</h1>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
`;
    }
    return `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">Welcome to Your App</h1>
    </div>
  );
}
`;
  }

  private getGlobalCss(tailwind: boolean): string {
    if (tailwind) {
      return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
`;
    }
    return `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
`;
  }

  private getGitignore(): string {
    return `node_modules/
dist/
.env
*.log
coverage/
`;
  }

  private getEslintConfig(): string {
    return `module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  rules: {},
};
`;
  }
}

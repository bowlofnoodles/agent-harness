import path from 'path';
import fs from 'fs-extra';
import type { ScaffoldConfig, ScaffoldResult } from '../types.js';
import { BaseScaffold } from './base-scaffold.js';
import { logger } from '../utils/logger.js';

/**
 * ExpressScaffold - Generates a modern Express + TypeScript backend API.
 */
export class ExpressScaffold extends BaseScaffold {
  readonly config: ScaffoldConfig = {
    name: 'express',
    description: 'Express + TypeScript REST API backend',
    type: 'backend',
    options: [
      { name: 'projectName', description: 'Project name', type: 'string', required: true },
      { name: 'useDatabase', description: 'Database type', type: 'select', choices: ['prisma-postgres', 'prisma-sqlite', 'none'], default: 'prisma-postgres', required: false },
      { name: 'useAuth', description: 'Include JWT authentication', type: 'boolean', default: true, required: false },
      { name: 'useDocker', description: 'Include Docker configuration', type: 'boolean', default: true, required: false },
    ],
  };

  async generate(targetDir: string, options: Record<string, unknown>): Promise<ScaffoldResult> {
    const projectName = options.projectName as string ?? 'my-api';
    const useDatabase = options.useDatabase as string ?? 'prisma-postgres';
    const useAuth = options.useAuth as boolean ?? true;
    const useDocker = options.useDocker as boolean ?? true;

    const projectDir = path.join(targetDir, projectName);
    const filesCreated: string[] = [];
    const commands: string[] = [];

    try {
      await fs.ensureDir(path.join(projectDir, 'src', 'routes'));
      await fs.ensureDir(path.join(projectDir, 'src', 'middleware'));
      await fs.ensureDir(path.join(projectDir, 'src', 'controllers'));
      await fs.ensureDir(path.join(projectDir, 'src', 'services'));
      await fs.ensureDir(path.join(projectDir, 'src', 'utils'));
      await fs.ensureDir(path.join(projectDir, 'src', 'types'));
      await fs.ensureDir(path.join(projectDir, 'tests'));

      // package.json
      const pkgJson = this.generatePackageJson(projectName, useDatabase, useAuth);
      await this.writeFile(projectDir, 'package.json', JSON.stringify(pkgJson, null, 2), filesCreated);

      // tsconfig.json
      await this.writeFile(projectDir, 'tsconfig.json', this.getTsConfig(), filesCreated);

      // src/index.ts (entry point)
      await this.writeFile(projectDir, 'src/index.ts', this.getEntryPoint(), filesCreated);

      // src/app.ts (Express app setup)
      await this.writeFile(projectDir, 'src/app.ts', this.getAppSetup(useAuth), filesCreated);

      // src/routes/health.ts
      await this.writeFile(projectDir, 'src/routes/health.ts', this.getHealthRoute(), filesCreated);

      // src/middleware/error-handler.ts
      await this.writeFile(projectDir, 'src/middleware/error-handler.ts', this.getErrorHandler(), filesCreated);

      // src/utils/logger.ts
      await this.writeFile(projectDir, 'src/utils/logger.ts', this.getLogger(), filesCreated);

      // .env.example
      await this.writeFile(projectDir, '.env.example', this.getEnvExample(useDatabase, useAuth), filesCreated);

      // .gitignore
      await this.writeFile(projectDir, '.gitignore', this.getGitignore(), filesCreated);

      // Auth middleware
      if (useAuth) {
        await this.writeFile(projectDir, 'src/middleware/auth.ts', this.getAuthMiddleware(), filesCreated);
      }

      // Docker files
      if (useDocker) {
        await this.writeFile(projectDir, 'Dockerfile', this.getDockerfile(), filesCreated);
        await this.writeFile(projectDir, 'docker-compose.yaml', this.getDockerCompose(useDatabase), filesCreated);
        await this.writeFile(projectDir, '.dockerignore', this.getDockerIgnore(), filesCreated);
      }

      commands.push(`cd ${projectName} && npm install`);
      commands.push('cp .env.example .env');
      commands.push('npm run dev');

      logger.info(`Express scaffold generated: ${filesCreated.length} files`);

      return this.successResult(filesCreated, commands, [
        `cd ${projectName}`,
        'npm install',
        'cp .env.example .env',
        'npm run dev',
        'API is available at http://localhost:3000',
        'Health check: GET http://localhost:3000/api/health',
      ]);
    } catch (error) {
      return this.failureResult([`Failed to generate Express scaffold: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }

  private async writeFile(baseDir: string, relativePath: string, content: string, tracker: string[]): Promise<void> {
    const fullPath = path.join(baseDir, relativePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
    tracker.push(relativePath);
  }

  private generatePackageJson(name: string, db: string, auth: boolean) {
    const deps: Record<string, string> = {
      express: '^4.21.0',
      cors: '^2.8.5',
      helmet: '^7.1.0',
      'express-rate-limit': '^7.4.0',
      dotenv: '^16.4.0',
      winston: '^3.14.0',
      zod: '^3.23.0',
    };
    const devDeps: Record<string, string> = {
      '@types/express': '^4.17.0',
      '@types/cors': '^2.8.0',
      '@types/node': '^20.16.0',
      typescript: '^5.5.0',
      tsx: '^4.19.0',
      vitest: '^1.6.0',
      eslint: '^8.57.0',
      '@typescript-eslint/eslint-plugin': '^7.0.0',
      '@typescript-eslint/parser': '^7.0.0',
    };

    if (db.startsWith('prisma')) deps['@prisma/client'] = '^5.19.0';
    if (db.startsWith('prisma')) devDeps['prisma'] = '^5.19.0';
    if (auth) deps['jsonwebtoken'] = '^9.0.0';
    if (auth) deps['bcryptjs'] = '^2.4.3';
    if (auth) devDeps['@types/jsonwebtoken'] = '^9.0.0';
    if (auth) devDeps['@types/bcryptjs'] = '^2.4.0';

    return {
      name,
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'tsx watch src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
        lint: 'eslint src/ --ext .ts',
        test: 'vitest run',
        'test:watch': 'vitest',
      },
      dependencies: deps,
      devDependencies: devDeps,
    };
  }

  private getTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'bundler',
        lib: ['ES2022'],
        outDir: 'dist',
        rootDir: 'src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        sourceMap: true,
      },
      include: ['src'],
      exclude: ['node_modules', 'dist'],
    }, null, 2);
  }

  private getEntryPoint(): string {
    return `import 'dotenv/config';
import { app } from './app.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.listen(PORT, () => {
  logger.info(\`Server running on http://localhost:\${PORT}\`);
});
`;
  }

  private getAppSetup(useAuth: boolean): string {
    return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/error-handler.js';
${useAuth ? "import { authMiddleware } from './middleware/auth.js';" : ''}

export const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Routes
app.use('/api/health', healthRouter);
${useAuth ? "// Protected routes example\n// app.use('/api/protected', authMiddleware, protectedRouter);" : ''}

// Error handling
app.use(errorHandler);
`;
  }

  private getHealthRoute(): string {
    return `import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
`;
  }

  private getErrorHandler(): string {
    return `import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  logger.error(\`[\${statusCode}] \${err.message}\`, {
    stack: err.stack,
    code: err.code,
  });

  res.status(statusCode).json({
    error: {
      message,
      code: err.code ?? 'INTERNAL_ERROR',
    },
  });
}
`;
  }

  private getLogger(): string {
    return `import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts }) => {
  return \`\${ts} [\${level}]: \${message}\`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: combine(timestamp(), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),
  ],
});
`;
  }

  private getAuthMiddleware(): string {
    return `import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'No token provided', code: 'AUTH_MISSING' } });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid token', code: 'AUTH_INVALID' } });
  }
}
`;
  }

  private getEnvExample(db: string, auth: boolean): string {
    let env = `PORT=3000
NODE_ENV=development
LOG_LEVEL=info
`;
    if (db === 'prisma-postgres') {
      env += `DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"\n`;
    } else if (db === 'prisma-sqlite') {
      env += `DATABASE_URL="file:./dev.db"\n`;
    }
    if (auth) {
      env += `JWT_SECRET=your-secret-key-change-in-production\n`;
    }
    return env;
  }

  private getGitignore(): string {
    return `node_modules/
dist/
.env
*.log
coverage/
`;
  }

  private getDockerfile(): string {
    return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
`;
  }

  private getDockerCompose(db: string): string {
    let compose = `services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on: []
`;
    if (db === 'prisma-postgres') {
      compose += `
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`;
    }
    return compose;
  }

  private getDockerIgnore(): string {
    return `node_modules/
dist/
.env
.git
*.log
coverage/
`;
  }
}

import path from 'path';
import fs from 'fs-extra';
import type { ScaffoldConfig, ScaffoldResult } from '../types.js';
import { BaseScaffold } from './base-scaffold.js';
import { logger } from '../utils/logger.js';

/**
 * NestjsScaffold - Generates a modern Nest.js + TypeScript backend API.
 *
 * Replaces both Express and Next.js as the canonical backend for
 * the React + Nest.js fullstack architecture. Includes:
 * - Modular architecture (modules/controllers/services)
 * - Swagger/OpenAPI documentation
 * - Class-validator DTO validation
 * - Prisma database integration
 * - JWT authentication guard
 * - Docker support
 * - CLAUDE.md / copilot-instructions.md for AI agent workflows
 */
export class NestjsScaffold extends BaseScaffold {
  readonly config: ScaffoldConfig = {
    name: 'nestjs',
    description: 'Nest.js + TypeScript modular backend API',
    type: 'backend',
    options: [
      { name: 'projectName', description: 'Project name', type: 'string', required: true },
      { name: 'useDatabase', description: 'Database type', type: 'select', choices: ['prisma-postgres', 'prisma-sqlite', 'none'], default: 'prisma-postgres', required: false },
      { name: 'useAuth', description: 'Include JWT authentication', type: 'boolean', default: true, required: false },
      { name: 'useSwagger', description: 'Include Swagger/OpenAPI docs', type: 'boolean', default: true, required: false },
      { name: 'useDocker', description: 'Include Docker configuration', type: 'boolean', default: true, required: false },
    ],
  };

  async generate(targetDir: string, options: Record<string, unknown>): Promise<ScaffoldResult> {
    const projectName = (options.projectName as string | undefined) ?? 'my-nestjs-api';
    const useDatabase = (options.useDatabase as string | undefined) ?? 'prisma-postgres';
    const useAuth = (options.useAuth as boolean | undefined) ?? true;
    const useSwagger = (options.useSwagger as boolean | undefined) ?? true;
    const useDocker = (options.useDocker as boolean | undefined) ?? true;

    const projectDir = path.join(targetDir, projectName);
    const filesCreated: string[] = [];
    const commands: string[] = [];

    try {
      // Create directory structure
      await fs.ensureDir(path.join(projectDir, 'src', 'common', 'filters'));
      await fs.ensureDir(path.join(projectDir, 'src', 'common', 'guards'));
      await fs.ensureDir(path.join(projectDir, 'src', 'common', 'interceptors'));
      await fs.ensureDir(path.join(projectDir, 'src', 'health'));
      await fs.ensureDir(path.join(projectDir, 'test'));

      if (useAuth) {
        await fs.ensureDir(path.join(projectDir, 'src', 'auth', 'dto'));
        await fs.ensureDir(path.join(projectDir, 'src', 'auth', 'guards'));
      }

      // package.json
      const pkgJson = this.generatePackageJson(projectName, useDatabase, useAuth, useSwagger);
      await this.writeFile(projectDir, 'package.json', JSON.stringify(pkgJson, null, 2), filesCreated);

      // tsconfig.json
      await this.writeFile(projectDir, 'tsconfig.json', this.getTsConfig(), filesCreated);

      // tsconfig.build.json
      await this.writeFile(projectDir, 'tsconfig.build.json', this.getTsBuildConfig(), filesCreated);

      // nest-cli.json
      await this.writeFile(projectDir, 'nest-cli.json', this.getNestCliJson(), filesCreated);

      // src/main.ts
      await this.writeFile(projectDir, 'src/main.ts', this.getMain(useSwagger), filesCreated);

      // src/app.module.ts
      await this.writeFile(projectDir, 'src/app.module.ts', this.getAppModule(useDatabase, useAuth), filesCreated);

      // src/app.controller.ts
      await this.writeFile(projectDir, 'src/app.controller.ts', this.getAppController(), filesCreated);

      // src/app.service.ts
      await this.writeFile(projectDir, 'src/app.service.ts', this.getAppService(), filesCreated);

      // Health module
      await this.writeFile(projectDir, 'src/health/health.module.ts', this.getHealthModule(), filesCreated);
      await this.writeFile(projectDir, 'src/health/health.controller.ts', this.getHealthController(), filesCreated);

      // Common: exception filter
      await this.writeFile(projectDir, 'src/common/filters/http-exception.filter.ts', this.getExceptionFilter(), filesCreated);

      // Common: logging interceptor
      await this.writeFile(projectDir, 'src/common/interceptors/logging.interceptor.ts', this.getLoggingInterceptor(), filesCreated);

      // .env.example
      await this.writeFile(projectDir, '.env.example', this.getEnvExample(useDatabase, useAuth), filesCreated);

      // .gitignore
      await this.writeFile(projectDir, '.gitignore', this.getGitignore(), filesCreated);

      // .eslintrc.js
      await this.writeFile(projectDir, '.eslintrc.js', this.getEslintConfig(), filesCreated);

      // Auth module
      if (useAuth) {
        await this.writeFile(projectDir, 'src/auth/auth.module.ts', this.getAuthModule(), filesCreated);
        await this.writeFile(projectDir, 'src/auth/auth.service.ts', this.getAuthService(), filesCreated);
        await this.writeFile(projectDir, 'src/auth/auth.controller.ts', this.getAuthController(), filesCreated);
        await this.writeFile(projectDir, 'src/auth/guards/jwt-auth.guard.ts', this.getJwtGuard(), filesCreated);
        await this.writeFile(projectDir, 'src/auth/dto/login.dto.ts', this.getLoginDto(), filesCreated);
      }

      // Database (Prisma)
      if (useDatabase.startsWith('prisma')) {
        await fs.ensureDir(path.join(projectDir, 'prisma'));
        await fs.ensureDir(path.join(projectDir, 'src', 'prisma'));
        await this.writeFile(projectDir, 'prisma/schema.prisma', this.getPrismaSchema(useDatabase, useAuth), filesCreated);
        await this.writeFile(projectDir, 'src/prisma/prisma.module.ts', this.getPrismaModule(), filesCreated);
        await this.writeFile(projectDir, 'src/prisma/prisma.service.ts', this.getPrismaService(), filesCreated);
      }

      // Docker
      if (useDocker) {
        await this.writeFile(projectDir, 'Dockerfile', this.getDockerfile(), filesCreated);
        await this.writeFile(projectDir, 'docker-compose.yaml', this.getDockerCompose(useDatabase), filesCreated);
        await this.writeFile(projectDir, '.dockerignore', this.getDockerIgnore(), filesCreated);
      }

      // AI agent instructions
      await this.writeFile(projectDir, 'CLAUDE.md', this.getClaudeMd(projectName, useDatabase, useAuth), filesCreated);
      await fs.ensureDir(path.join(projectDir, '.github'));
      await this.writeFile(projectDir, '.github/copilot-instructions.md', this.getCopilotInstructions(projectName, useDatabase, useAuth), filesCreated);

      // Setup commands
      commands.push(`cd ${projectName} && npm install`);
      commands.push('cp .env.example .env');
      if (useDatabase.startsWith('prisma')) {
        commands.push('npx prisma generate');
        commands.push('npx prisma db push');
      }
      commands.push('npm run start:dev');

      logger.info(`Nest.js scaffold generated: ${filesCreated.length} files`);

      return this.successResult(filesCreated, commands, [
        `cd ${projectName}`,
        'npm install',
        'cp .env.example .env',
        ...(useDatabase.startsWith('prisma') ? ['npx prisma generate', 'npx prisma db push'] : []),
        'npm run start:dev',
        'API is available at http://localhost:3000',
        ...(useSwagger ? ['Swagger docs: http://localhost:3000/api/docs'] : []),
        'Health check: GET http://localhost:3000/health',
      ]);
    } catch (error) {
      return this.failureResult([`Failed to generate Nest.js scaffold: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }

  private async writeFile(baseDir: string, relativePath: string, content: string, tracker: string[]): Promise<void> {
    const fullPath = path.join(baseDir, relativePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
    tracker.push(relativePath);
  }

  // ─── package.json ───────────────────────────────────────────

  private generatePackageJson(name: string, db: string, auth: boolean, swagger: boolean) {
    const deps: Record<string, string> = {
      '@nestjs/common': '^10.4.0',
      '@nestjs/core': '^10.4.0',
      '@nestjs/platform-express': '^10.4.0',
      'class-transformer': '^0.5.1',
      'class-validator': '^0.14.1',
      'reflect-metadata': '^0.2.2',
      rxjs: '^7.8.1',
    };
    const devDeps: Record<string, string> = {
      '@nestjs/cli': '^10.4.0',
      '@nestjs/schematics': '^10.1.0',
      '@nestjs/testing': '^10.4.0',
      '@types/express': '^4.17.0',
      '@types/node': '^20.16.0',
      '@typescript-eslint/eslint-plugin': '^7.0.0',
      '@typescript-eslint/parser': '^7.0.0',
      eslint: '^8.57.0',
      'source-map-support': '^0.5.21',
      'ts-loader': '^9.5.0',
      'ts-node': '^10.9.0',
      'tsconfig-paths': '^4.2.0',
      typescript: '^5.5.0',
      vitest: '^1.6.0',
    };

    if (swagger) {
      deps['@nestjs/swagger'] = '^7.4.0';
    }
    if (db.startsWith('prisma')) {
      deps['@prisma/client'] = '^5.19.0';
      devDeps['prisma'] = '^5.19.0';
    }
    if (auth) {
      deps['@nestjs/jwt'] = '^10.2.0';
      deps['@nestjs/passport'] = '^10.0.3';
      deps['passport'] = '^0.7.0';
      deps['passport-jwt'] = '^4.0.1';
      deps['bcryptjs'] = '^2.4.3';
      devDeps['@types/passport-jwt'] = '^4.0.1';
      devDeps['@types/bcryptjs'] = '^2.4.0';
    }

    return {
      name,
      version: '0.1.0',
      private: true,
      scripts: {
        build: 'nest build',
        format: 'prettier --write "src/**/*.ts" "test/**/*.ts"',
        start: 'nest start',
        'start:dev': 'nest start --watch',
        'start:debug': 'nest start --debug --watch',
        'start:prod': 'node dist/main',
        lint: 'eslint "src/**/*.ts" --fix',
        test: 'vitest run',
        'test:watch': 'vitest',
      },
      dependencies: deps,
      devDependencies: devDeps,
    };
  }

  // ─── TypeScript configs ─────────────────────────────────────

  private getTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        module: 'commonjs',
        declaration: true,
        removeComments: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        allowSyntheticDefaultImports: true,
        target: 'ES2021',
        sourceMap: true,
        outDir: './dist',
        baseUrl: './',
        incremental: true,
        skipLibCheck: true,
        strictNullChecks: true,
        noImplicitAny: true,
        strictBindCallApply: true,
        forceConsistentCasingInFileNames: true,
        noFallthroughCasesInSwitch: true,
        paths: { '@/*': ['./src/*'] },
      },
    }, null, 2);
  }

  private getTsBuildConfig(): string {
    return JSON.stringify({
      extends: './tsconfig.json',
      exclude: ['node_modules', 'test', 'dist', '**/*spec.ts'],
    }, null, 2);
  }

  private getNestCliJson(): string {
    return JSON.stringify({
      $schema: 'https://json.schemastore.org/nest-cli',
      collection: '@nestjs/schematics',
      sourceRoot: 'src',
      compilerOptions: { deleteOutDir: true },
    }, null, 2);
  }

  // ─── Main entry ─────────────────────────────────────────────

  private getMain(swagger: boolean): string {
    return `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
${swagger ? "import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';" : ''}
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
${swagger ? `
  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
` : ''}
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(\`Application is running on: http://localhost:\${port}\`);
}
bootstrap();
`;
  }

  // ─── App module / controller / service ──────────────────────

  private getAppModule(db: string, auth: boolean): string {
    const imports: string[] = [];
    const modules: string[] = ['HealthModule'];

    imports.push("import { Module } from '@nestjs/common';");
    imports.push("import { AppController } from './app.controller';");
    imports.push("import { AppService } from './app.service';");
    imports.push("import { HealthModule } from './health/health.module';");

    if (db.startsWith('prisma')) {
      imports.push("import { PrismaModule } from './prisma/prisma.module';");
      modules.push('PrismaModule');
    }
    if (auth) {
      imports.push("import { AuthModule } from './auth/auth.module';");
      modules.push('AuthModule');
    }

    return `${imports.join('\n')}

@Module({
  imports: [${modules.join(', ')}],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
  }

  private getAppController(): string {
    return `import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
`;
  }

  private getAppService(): string {
    return `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from Nest.js API!';
  }
}
`;
  }

  // ─── Health module ──────────────────────────────────────────

  private getHealthModule(): string {
    return `import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
`;
  }

  private getHealthController(): string {
    return `import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
`;
  }

  // ─── Common ─────────────────────────────────────────────────

  private getExceptionFilter(): string {
    return `import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      \`\${request.method} \${request.url} \${status}\`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as Record<string, unknown>).message ?? message,
    });
  }
}
`;
  }

  private getLoggingInterceptor(): string {
    return `import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(\`\${method} \${url} - \${Date.now() - now}ms\`),
        ),
      );
  }
}
`;
  }

  // ─── Auth module ────────────────────────────────────────────

  private getAuthModule(): string {
    return `import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
`;
  }

  private getAuthService(): string {
    return `import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(email: string, _password: string) {
    // TODO: Replace with real user lookup and bcrypt password comparison
    if (!email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: 'user-id', email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
`;
  }

  private getAuthController(): string {
    return `import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
`;
  }

  private getJwtGuard(): string {
    return `import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const token = authHeader.substring(7);
    try {
      request.user = await this.authService.validateToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
`;
  }

  private getLoginDto(): string {
    return `import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
`;
  }

  // ─── Prisma ─────────────────────────────────────────────────

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

  private getPrismaModule(): string {
    return `import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`;
  }

  private getPrismaService(): string {
    return `import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
`;
  }

  // ─── Docker ─────────────────────────────────────────────────

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
CMD ["node", "dist/main"]
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

  // ─── Config files ───────────────────────────────────────────

  private getEnvExample(db: string, auth: boolean): string {
    let env = `PORT=3000
NODE_ENV=development
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

  private getEslintConfig(): string {
    return `module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: { node: true, jest: true },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
`;
  }

  // ─── AI Agent Instructions ──────────────────────────────────

  private getClaudeMd(projectName: string, db: string, auth: boolean): string {
    return `# CLAUDE.md — AI Agent Instructions for ${projectName}

This file provides context for Claude Code and other AI coding agents working on this project.

## Project Overview

- **Framework**: Nest.js (TypeScript)
- **Architecture**: Modular (Modules → Controllers → Services)
${db.startsWith('prisma') ? '- **Database**: Prisma ORM with PostgreSQL' : ''}
${auth ? '- **Auth**: JWT-based authentication via @nestjs/passport' : ''}

## Project Structure

\`\`\`
src/
├── main.ts                    # Bootstrap & Swagger setup
├── app.module.ts              # Root module
├── app.controller.ts          # Root controller
├── app.service.ts             # Root service
├── health/                    # Health check module
│   ├── health.module.ts
│   └── health.controller.ts
├── common/                    # Shared utilities
│   ├── filters/               # Exception filters
│   └── interceptors/          # Request interceptors
${auth ? `├── auth/                      # Auth module
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── guards/jwt-auth.guard.ts
│   └── dto/login.dto.ts` : ''}
${db.startsWith('prisma') ? `├── prisma/                    # Database module
│   ├── prisma.module.ts
│   └── prisma.service.ts` : ''}
\`\`\`

## Commands

| Command | Description |
|---------|-------------|
| \`npm run start:dev\` | Start dev server with hot-reload |
| \`npm run build\` | Build for production |
| \`npm run test\` | Run tests |
| \`npm run lint\` | Lint and fix |
${db.startsWith('prisma') ? '| `npx prisma studio` | Open Prisma Studio GUI |\n| `npx prisma migrate dev` | Run database migrations |' : ''}

## Conventions

- Every feature lives in its own **module** folder (e.g. \`src/users/\`)
- Use **DTOs** with \`class-validator\` decorators for input validation
- Use **Guards** for authentication/authorization
- Use \`@nestjs/swagger\` decorators (\`@ApiTags\`, \`@ApiOperation\`) on every controller
- Prefix all API routes with the module name (e.g. \`/users\`, \`/auth\`)
- Write tests alongside source files as \`*.spec.ts\`

## Adding a New Module

\`\`\`bash
# Use Nest CLI to generate
npx nest g resource users

# This creates:
# src/users/users.module.ts
# src/users/users.controller.ts
# src/users/users.service.ts
# src/users/dto/
# src/users/entities/
\`\`\`

Then register the module in \`app.module.ts\` imports.
`;
  }

  private getCopilotInstructions(projectName: string, db: string, auth: boolean): string {
    return `# Copilot Instructions for ${projectName}

## Project Context

This is a Nest.js TypeScript backend API following modular architecture.

## Code Style

- Use TypeScript strict mode
- Follow Nest.js conventions: decorators, dependency injection, modules
- Use \`class-validator\` for DTO validation
- Use \`class-transformer\` for serialization
- Prefer constructor injection over property injection

## Architecture Rules

- Each feature = 1 module with its own controller, service, DTOs, and entities
- Business logic belongs in **services**, not controllers
- Controllers handle HTTP concerns only (request/response)
- Use **guards** for auth, **interceptors** for cross-cutting concerns
- Use **pipes** for input validation/transformation

## Database
${db.startsWith('prisma') ? `
- ORM: Prisma
- Inject \`PrismaService\` to access the database
- Define models in \`prisma/schema.prisma\`
- Run \`npx prisma migrate dev\` after schema changes
` : '- No database configured yet'}

## Authentication
${auth ? `
- JWT-based via \`@nestjs/passport\`
- Use \`@UseGuards(JwtAuthGuard)\` on protected endpoints
- Token is passed as \`Bearer <token>\` in Authorization header
` : '- No auth configured yet'}

## Testing

- Use vitest for unit tests
- Mock dependencies with \`@nestjs/testing\` Test module
- Test files: \`*.spec.ts\` next to source files
`;
  }
}

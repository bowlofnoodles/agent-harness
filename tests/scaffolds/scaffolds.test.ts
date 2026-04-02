import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScaffoldRegistry, ReactScaffold, NestjsScaffold } from '../../src/scaffolds/index.js';
import fs from 'fs-extra';
import path from 'path';

const TEST_OUTPUT = '/tmp/test-scaffold-output';

describe('ScaffoldRegistry', () => {
  it('should register and retrieve scaffolds', () => {
    const registry = new ScaffoldRegistry('/tmp');
    registry.register(new ReactScaffold());

    expect(registry.has('react')).toBe(true);
    expect(registry.get('react')).toBeInstanceOf(ReactScaffold);
  });

  it('should register all default scaffolds', () => {
    const registry = new ScaffoldRegistry('/tmp');
    registry.registerDefaults();

    expect(registry.count).toBe(2);
    expect(registry.has('react')).toBe(true);
    expect(registry.has('nestjs')).toBe(true);
  });

  it('should list scaffold configs', () => {
    const registry = new ScaffoldRegistry('/tmp');
    registry.registerDefaults();

    const configs = registry.getConfigs();
    expect(configs.length).toBe(2);
    expect(configs.map(c => c.name)).toContain('react');
    expect(configs.map(c => c.name)).toContain('nestjs');
  });
});

describe('ReactScaffold', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_OUTPUT);
  });

  afterEach(async () => {
    await fs.remove(TEST_OUTPUT);
  });

  it('should generate a React project', async () => {
    const scaffold = new ReactScaffold();
    const result = await scaffold.generate(TEST_OUTPUT, {
      projectName: 'test-react-app',
      useTailwind: true,
      useRouter: true,
      stateManager: 'zustand',
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated.length).toBeGreaterThan(0);
    expect(result.filesCreated).toContain('package.json');
    expect(result.filesCreated).toContain('src/App.tsx');
    expect(result.filesCreated).toContain('src/main.tsx');

    // Verify files actually exist
    const projectDir = path.join(TEST_OUTPUT, 'test-react-app');
    expect(await fs.pathExists(path.join(projectDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(projectDir, 'src', 'App.tsx'))).toBe(true);
  });

  it('should have correct scaffold config', () => {
    const scaffold = new ReactScaffold();
    expect(scaffold.config.name).toBe('react');
    expect(scaffold.config.type).toBe('frontend');
    expect(scaffold.config.options.length).toBeGreaterThan(0);
  });

  it('should generate AI agent instruction files', async () => {
    const scaffold = new ReactScaffold();
    const result = await scaffold.generate(TEST_OUTPUT, {
      projectName: 'test-react-ai',
      useTailwind: true,
      useRouter: true,
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated).toContain('CLAUDE.md');
    expect(result.filesCreated).toContain('.github/copilot-instructions.md');

    const projectDir = path.join(TEST_OUTPUT, 'test-react-ai');
    expect(await fs.pathExists(path.join(projectDir, 'CLAUDE.md'))).toBe(true);
    expect(await fs.pathExists(path.join(projectDir, '.github', 'copilot-instructions.md'))).toBe(true);
  });
});

describe('NestjsScaffold', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_OUTPUT);
  });

  afterEach(async () => {
    await fs.remove(TEST_OUTPUT);
  });

  it('should generate a Nest.js API project', async () => {
    const scaffold = new NestjsScaffold();
    const result = await scaffold.generate(TEST_OUTPUT, {
      projectName: 'test-nestjs-api',
      useDatabase: 'prisma-postgres',
      useAuth: true,
      useSwagger: true,
      useDocker: true,
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated).toContain('package.json');
    expect(result.filesCreated).toContain('nest-cli.json');
    expect(result.filesCreated).toContain('src/main.ts');
    expect(result.filesCreated).toContain('src/app.module.ts');
    expect(result.filesCreated).toContain('src/app.controller.ts');
    expect(result.filesCreated).toContain('src/app.service.ts');
    expect(result.filesCreated).toContain('src/health/health.module.ts');
    expect(result.filesCreated).toContain('src/health/health.controller.ts');
    expect(result.filesCreated).toContain('src/auth/auth.module.ts');
    expect(result.filesCreated).toContain('src/auth/auth.service.ts');
    expect(result.filesCreated).toContain('src/auth/auth.controller.ts');
    expect(result.filesCreated).toContain('src/auth/guards/jwt-auth.guard.ts');
    expect(result.filesCreated).toContain('src/auth/dto/login.dto.ts');
    expect(result.filesCreated).toContain('prisma/schema.prisma');
    expect(result.filesCreated).toContain('src/prisma/prisma.module.ts');
    expect(result.filesCreated).toContain('src/prisma/prisma.service.ts');
    expect(result.filesCreated).toContain('Dockerfile');
    expect(result.filesCreated).toContain('docker-compose.yaml');
    expect(result.filesCreated).toContain('CLAUDE.md');
    expect(result.filesCreated).toContain('.github/copilot-instructions.md');
  });

  it('should skip auth, swagger, database, docker when disabled', async () => {
    const scaffold = new NestjsScaffold();
    const result = await scaffold.generate(TEST_OUTPUT, {
      projectName: 'test-nestjs-minimal',
      useDatabase: 'none',
      useAuth: false,
      useSwagger: false,
      useDocker: false,
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated).toContain('src/main.ts');
    expect(result.filesCreated).toContain('src/app.module.ts');
    expect(result.filesCreated).not.toContain('Dockerfile');
    expect(result.filesCreated).not.toContain('src/auth/auth.module.ts');
    expect(result.filesCreated).not.toContain('prisma/schema.prisma');
    // AI instructions should always be generated
    expect(result.filesCreated).toContain('CLAUDE.md');
    expect(result.filesCreated).toContain('.github/copilot-instructions.md');
  });

  it('should have correct scaffold config', () => {
    const scaffold = new NestjsScaffold();
    expect(scaffold.config.name).toBe('nestjs');
    expect(scaffold.config.type).toBe('backend');
    expect(scaffold.config.options.length).toBeGreaterThan(0);
  });
});

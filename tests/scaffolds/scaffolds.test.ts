import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScaffoldRegistry, ReactScaffold, ExpressScaffold, NextjsScaffold } from '../../src/scaffolds/index.js';
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

    expect(registry.count).toBe(3);
    expect(registry.has('react')).toBe(true);
    expect(registry.has('express')).toBe(true);
    expect(registry.has('nextjs')).toBe(true);
  });

  it('should list scaffold configs', () => {
    const registry = new ScaffoldRegistry('/tmp');
    registry.registerDefaults();

    const configs = registry.getConfigs();
    expect(configs.length).toBe(3);
    expect(configs.map(c => c.name)).toContain('react');
    expect(configs.map(c => c.name)).toContain('express');
    expect(configs.map(c => c.name)).toContain('nextjs');
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
});

describe('ExpressScaffold', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_OUTPUT);
  });

  afterEach(async () => {
    await fs.remove(TEST_OUTPUT);
  });

  it('should generate an Express API project', async () => {
    const scaffold = new ExpressScaffold();
    const result = await scaffold.generate(TEST_OUTPUT, {
      projectName: 'test-api',
      useDatabase: 'prisma-postgres',
      useAuth: true,
      useDocker: true,
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated).toContain('package.json');
    expect(result.filesCreated).toContain('src/index.ts');
    expect(result.filesCreated).toContain('src/app.ts');
    expect(result.filesCreated).toContain('Dockerfile');
    expect(result.filesCreated).toContain('docker-compose.yaml');
    expect(result.filesCreated).toContain('src/middleware/auth.ts');
  });

  it('should skip auth and docker when disabled', async () => {
    const scaffold = new ExpressScaffold();
    const result = await scaffold.generate(TEST_OUTPUT, {
      projectName: 'test-minimal-api',
      useDatabase: 'none',
      useAuth: false,
      useDocker: false,
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated).not.toContain('Dockerfile');
    expect(result.filesCreated).not.toContain('src/middleware/auth.ts');
  });
});

describe('NextjsScaffold', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_OUTPUT);
  });

  afterEach(async () => {
    await fs.remove(TEST_OUTPUT);
  });

  it('should generate a Next.js fullstack project', async () => {
    const scaffold = new NextjsScaffold();
    const result = await scaffold.generate(TEST_OUTPUT, {
      projectName: 'test-nextjs',
      useTailwind: true,
      useDatabase: 'prisma-postgres',
      useAuth: true,
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated).toContain('package.json');
    expect(result.filesCreated).toContain('src/app/layout.tsx');
    expect(result.filesCreated).toContain('src/app/page.tsx');
    expect(result.filesCreated).toContain('src/app/api/health/route.ts');
    expect(result.filesCreated).toContain('prisma/schema.prisma');
    expect(result.filesCreated).toContain('tailwind.config.ts');
  });

  it('should generate without optional features', async () => {
    const scaffold = new NextjsScaffold();
    const result = await scaffold.generate(TEST_OUTPUT, {
      projectName: 'test-nextjs-minimal',
      useTailwind: false,
      useDatabase: 'none',
      useAuth: false,
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated).not.toContain('tailwind.config.ts');
    expect(result.filesCreated).not.toContain('prisma/schema.prisma');
  });
});

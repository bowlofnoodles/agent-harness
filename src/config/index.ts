import fs from 'fs-extra';
import path from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';
import type { HarnessConfig } from '../types.js';
import { ConfigError } from '../utils/errors.js';

const CONFIG_FILENAME = '.harness.yaml';

/** Zod schema for validating harness configuration */
const HarnessConfigSchema = z.object({
  projectName: z.string().min(1),
  projectRoot: z.string().min(1),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  memoryPath: z.string().default('.harness/memory.json'),
  maxConcurrentTasks: z.number().min(1).max(10).default(3),
  defaultScaffold: z.string().default('nestjs'),
  validation: z.object({
    lintOnSave: z.boolean().default(true),
    testOnCommit: z.boolean().default(true),
    securityScan: z.boolean().default(true),
  }).default({}),
  git: z.object({
    autoCommit: z.boolean().default(true),
    commitPrefix: z.string().default('[harness]'),
    branch: z.string().default('main'),
  }).default({}),
});

/** Default configuration values */
export function getDefaultConfig(projectRoot: string): HarnessConfig {
  return {
    projectName: path.basename(projectRoot),
    projectRoot,
    logLevel: 'info',
    memoryPath: path.join(projectRoot, '.harness', 'memory.json'),
    maxConcurrentTasks: 3,
    defaultScaffold: 'nestjs',
    validation: {
      lintOnSave: true,
      testOnCommit: true,
      securityScan: true,
    },
    git: {
      autoCommit: true,
      commitPrefix: '[harness]',
      branch: 'main',
    },
  };
}

/** Load configuration from .harness.yaml in the project root */
export async function loadConfig(projectRoot: string): Promise<HarnessConfig> {
  const configPath = path.join(projectRoot, CONFIG_FILENAME);

  if (!await fs.pathExists(configPath)) {
    return getDefaultConfig(projectRoot);
  }

  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    const parsed = parseYaml(raw);
    const validated = HarnessConfigSchema.parse({
      ...parsed,
      projectRoot,
    });
    return validated as HarnessConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ConfigError(
        `Invalid configuration: ${error.errors.map(e => e.message).join(', ')}`,
        { path: configPath, errors: error.errors },
      );
    }
    throw new ConfigError(
      `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`,
      { path: configPath },
    );
  }
}

/** Save configuration to .harness.yaml */
export async function saveConfig(config: HarnessConfig): Promise<void> {
  const configPath = path.join(config.projectRoot, CONFIG_FILENAME);
  const { projectRoot: _projectRoot, ...serializable } = config;

  await fs.ensureDir(path.dirname(configPath));
  const yamlContent = stringifyYaml(serializable, { indent: 2 });
  await fs.writeFile(configPath, yamlContent, 'utf-8');
}

/** Initialize configuration directory and files */
export async function initConfig(projectRoot: string): Promise<HarnessConfig> {
  const harnessDir = path.join(projectRoot, '.harness');
  await fs.ensureDir(harnessDir);

  const config = getDefaultConfig(projectRoot);
  await saveConfig(config);

  return config;
}

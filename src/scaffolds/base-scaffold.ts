import type { ScaffoldConfig, ScaffoldResult } from '../types.js';

/**
 * BaseScaffold - Abstract interface for all scaffold generators.
 *
 * Each scaffold defines a project template with configurable options.
 * It generates files, runs setup commands, and provides guidance
 * for next steps.
 */
export abstract class BaseScaffold {
  abstract readonly config: ScaffoldConfig;

  /** Generate the project scaffold */
  abstract generate(
    targetDir: string,
    options: Record<string, unknown>,
  ): Promise<ScaffoldResult>;

  /** Get the scaffold configuration */
  getConfig(): ScaffoldConfig {
    return this.config;
  }

  /** Create a success result helper */
  protected successResult(
    filesCreated: string[],
    commands: string[],
    nextSteps: string[],
  ): ScaffoldResult {
    return {
      success: true,
      filesCreated,
      commands,
      errors: [],
      nextSteps,
    };
  }

  /** Create a failure result helper */
  protected failureResult(errors: string[]): ScaffoldResult {
    return {
      success: false,
      filesCreated: [],
      commands: [],
      errors,
      nextSteps: [],
    };
  }
}

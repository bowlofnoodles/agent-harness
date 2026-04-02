import { BaseScaffold } from './base-scaffold.js';
import { ReactScaffold } from './react-app.js';
import { NestjsScaffold } from './nestjs-api.js';
import type { ScaffoldConfig } from '../types.js';

/**
 * ScaffoldRegistry - Central registry for all available scaffolds.
 *
 * Provides discovery and management of scaffold generators.
 * The default stack is React (frontend) + Nest.js (backend).
 * New scaffolds can be registered dynamically.
 */
export class ScaffoldRegistry {
  private scaffolds: Map<string, BaseScaffold> = new Map();
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /** Register a scaffold */
  register(scaffold: BaseScaffold): void {
    this.scaffolds.set(scaffold.config.name, scaffold);
  }

  /** Register all built-in default scaffolds */
  registerDefaults(): void {
    this.register(new ReactScaffold());
    this.register(new NestjsScaffold());
  }

  /** Get a scaffold by name */
  get(name: string): BaseScaffold | undefined {
    return this.scaffolds.get(name);
  }

  /** Check if a scaffold exists */
  has(name: string): boolean {
    return this.scaffolds.has(name);
  }

  /** Get all scaffold configs */
  getConfigs(): ScaffoldConfig[] {
    return Array.from(this.scaffolds.values()).map(s => s.config);
  }

  /** Get all registered scaffold names */
  getNames(): string[] {
    return Array.from(this.scaffolds.keys());
  }

  /** Get count of registered scaffolds */
  get count(): number {
    return this.scaffolds.size;
  }

  /** Get the project root */
  getProjectRoot(): string {
    return this.projectRoot;
  }
}

export { BaseScaffold } from './base-scaffold.js';
export { ReactScaffold } from './react-app.js';
export { NestjsScaffold } from './nestjs-api.js';

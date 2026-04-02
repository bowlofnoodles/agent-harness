import { BaseTool } from './base-tool.js';
import { FileSystemTool } from './file-system.js';
import { ShellTool } from './shell.js';
import { GitTool } from './git.js';

/**
 * ToolRegistry - Central registry for all available tools.
 *
 * Follows the plugin pattern, allowing tools to be registered
 * and discovered dynamically. The agent uses this registry to
 * find and invoke the right tool for each task.
 */
export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  /** Register a tool */
  register(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }

  /** Register all built-in default tools */
  registerDefaults(): void {
    this.register(new FileSystemTool());
    this.register(new ShellTool());
    this.register(new GitTool());
  }

  /** Get a tool by name */
  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /** Check if a tool exists */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** Get all registered tool names */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /** Get all registered tools */
  getAll(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  /** Get count of registered tools */
  get count(): number {
    return this.tools.size;
  }
}

export { BaseTool } from './base-tool.js';
export { FileSystemTool } from './file-system.js';
export { ShellTool } from './shell.js';
export { GitTool } from './git.js';

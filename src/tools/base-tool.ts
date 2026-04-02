import type { ToolResult } from '../types.js';

/**
 * BaseTool - Abstract interface for all tools in the harness.
 *
 * Tools are the "hands" of the agent. Each tool provides a specific
 * capability (file system, shell, git, etc.) and follows a consistent
 * interface for execution and result reporting.
 */
export abstract class BaseTool {
  abstract readonly name: string;
  abstract readonly description: string;

  /** Execute the tool with the given parameters */
  abstract execute(params: Record<string, unknown>): Promise<ToolResult>;

  /** Validate parameters before execution */
  validate(_params: Record<string, unknown>): string[] {
    return [];
  }

  /** Create a success result */
  protected success(output: string): ToolResult {
    return { success: true, output, errors: [] };
  }

  /** Create a failure result */
  protected failure(errors: string[], output: string = ''): ToolResult {
    return { success: false, output, errors };
  }
}

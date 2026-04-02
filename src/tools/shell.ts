import { exec, type ExecOptions } from 'child_process';
import type { ToolResult } from '../types.js';
import { BaseTool } from './base-tool.js';

/**
 * ShellTool - Executes shell commands for the agent.
 */
export class ShellTool extends BaseTool {
  readonly name = 'shell';
  readonly description = 'Execute shell commands in the project directory';

  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    super();
    this.cwd = cwd;
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const command = params.command as string;
    if (!command) {
      return this.failure(['No command provided']);
    }

    const timeout = (params.timeout as number) ?? 30000;
    const cwd = (params.cwd as string) ?? this.cwd;

    return this.runCommand(command, { cwd, timeout });
  }

  private runCommand(command: string, options: ExecOptions): Promise<ToolResult> {
    return new Promise((resolve) => {
      exec(command, { ...options, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          resolve(this.failure(
            [error.message, stderr.toString()].filter(Boolean),
            stdout.toString(),
          ));
        } else {
          resolve(this.success(stdout.toString() + (stderr ? `\n[stderr]: ${stderr}` : '')));
        }
      });
    });
  }
}

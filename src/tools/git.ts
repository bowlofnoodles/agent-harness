import type { ToolResult } from '../types.js';
import { BaseTool } from './base-tool.js';
import { ShellTool } from './shell.js';

/**
 * GitTool - Provides Git operations for the agent.
 */
export class GitTool extends BaseTool {
  readonly name = 'git';
  readonly description = 'Execute Git operations (status, commit, branch, etc.)';

  private shell: ShellTool;

  constructor(cwd: string = process.cwd()) {
    super();
    this.shell = new ShellTool(cwd);
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const action = params.action as string;

    switch (action) {
      case 'init':
        return this.shell.execute({ command: 'git init' });
      case 'status':
        return this.shell.execute({ command: 'git status --porcelain' });
      case 'add':
        return this.shell.execute({ command: `git add ${params.files ?? '.'}` });
      case 'commit':
        return this.shell.execute({
          command: `git commit -m "${(params.message as string).replace(/"/g, '\\"')}"`,
        });
      case 'branch':
        return this.shell.execute({ command: `git checkout -b ${params.name}` });
      case 'log':
        return this.shell.execute({ command: `git log --oneline -${params.count ?? 10}` });
      case 'diff':
        return this.shell.execute({ command: 'git diff --stat' });
      default:
        return this.failure([`Unknown git action: ${action}`]);
    }
  }
}

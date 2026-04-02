import fs from 'fs-extra';
import path from 'path';
import type { ToolResult } from '../types.js';
import { BaseTool } from './base-tool.js';

/**
 * FileSystemTool - Provides file system operations for the agent.
 */
export class FileSystemTool extends BaseTool {
  readonly name = 'filesystem';
  readonly description = 'Read, write, create, and delete files and directories';

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const action = params.action as string;

    switch (action) {
      case 'read':
        return this.readFile(params.path as string);
      case 'write':
        return this.writeFile(params.path as string, params.content as string);
      case 'mkdir':
        return this.makeDir(params.path as string);
      case 'exists':
        return this.checkExists(params.path as string);
      case 'list':
        return this.listDir(params.path as string);
      case 'delete':
        return this.deleteFile(params.path as string);
      case 'copy':
        return this.copyFile(params.source as string, params.destination as string);
      default:
        return this.failure([`Unknown file system action: ${action}`]);
    }
  }

  private async readFile(filePath: string): Promise<ToolResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.success(content);
    } catch (error) {
      return this.failure([`Failed to read file: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }

  private async writeFile(filePath: string, content: string): Promise<ToolResult> {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
      return this.success(`File written: ${filePath}`);
    } catch (error) {
      return this.failure([`Failed to write file: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }

  private async makeDir(dirPath: string): Promise<ToolResult> {
    try {
      await fs.ensureDir(dirPath);
      return this.success(`Directory created: ${dirPath}`);
    } catch (error) {
      return this.failure([`Failed to create directory: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }

  private async checkExists(targetPath: string): Promise<ToolResult> {
    const exists = await fs.pathExists(targetPath);
    return this.success(exists ? 'true' : 'false');
  }

  private async listDir(dirPath: string): Promise<ToolResult> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const listing = entries.map(e => `${e.isDirectory() ? '[DIR]' : '[FILE]'} ${e.name}`);
      return this.success(listing.join('\n'));
    } catch (error) {
      return this.failure([`Failed to list directory: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }

  private async deleteFile(targetPath: string): Promise<ToolResult> {
    try {
      await fs.remove(targetPath);
      return this.success(`Deleted: ${targetPath}`);
    } catch (error) {
      return this.failure([`Failed to delete: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }

  private async copyFile(source: string, destination: string): Promise<ToolResult> {
    try {
      await fs.copy(source, destination);
      return this.success(`Copied: ${source} -> ${destination}`);
    } catch (error) {
      return this.failure([`Failed to copy: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }
}

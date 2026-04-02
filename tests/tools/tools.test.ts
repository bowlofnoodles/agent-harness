import { describe, it, expect } from 'vitest';
import { ToolRegistry, FileSystemTool, ShellTool, GitTool } from '../../src/tools/index.js';

describe('ToolRegistry', () => {
  it('should register and retrieve tools', () => {
    const registry = new ToolRegistry();
    registry.register(new FileSystemTool());

    expect(registry.has('filesystem')).toBe(true);
    expect(registry.get('filesystem')).toBeInstanceOf(FileSystemTool);
  });

  it('should register all default tools', () => {
    const registry = new ToolRegistry();
    registry.registerDefaults();

    expect(registry.count).toBe(3);
    expect(registry.has('filesystem')).toBe(true);
    expect(registry.has('shell')).toBe(true);
    expect(registry.has('git')).toBe(true);
  });

  it('should list all tool names', () => {
    const registry = new ToolRegistry();
    registry.registerDefaults();

    const names = registry.getNames();
    expect(names).toContain('filesystem');
    expect(names).toContain('shell');
    expect(names).toContain('git');
  });

  it('should return undefined for unknown tool', () => {
    const registry = new ToolRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
    expect(registry.has('nonexistent')).toBe(false);
  });
});

describe('FileSystemTool', () => {
  it('should read a file', async () => {
    const tool = new FileSystemTool();
    const result = await tool.execute({
      action: 'read',
      path: '/home/runner/work/agent-harness/agent-harness/package.json',
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain('agent-harness');
  });

  it('should write and read a file', async () => {
    const tool = new FileSystemTool();
    const testPath = '/tmp/test-fs-tool.txt';

    const writeResult = await tool.execute({
      action: 'write',
      path: testPath,
      content: 'Hello, World!',
    });
    expect(writeResult.success).toBe(true);

    const readResult = await tool.execute({ action: 'read', path: testPath });
    expect(readResult.success).toBe(true);
    expect(readResult.output).toBe('Hello, World!');
  });

  it('should check file existence', async () => {
    const tool = new FileSystemTool();

    const exists = await tool.execute({
      action: 'exists',
      path: '/home/runner/work/agent-harness/agent-harness/package.json',
    });
    expect(exists.output).toBe('true');

    const notExists = await tool.execute({
      action: 'exists',
      path: '/tmp/nonexistent-file-12345.txt',
    });
    expect(notExists.output).toBe('false');
  });

  it('should handle unknown action', async () => {
    const tool = new FileSystemTool();
    const result = await tool.execute({ action: 'unknown' });
    expect(result.success).toBe(false);
  });
});

describe('ShellTool', () => {
  it('should execute a command', async () => {
    const tool = new ShellTool();
    const result = await tool.execute({ command: 'echo "hello"' });
    expect(result.success).toBe(true);
    expect(result.output.trim()).toBe('hello');
  });

  it('should fail for invalid command', async () => {
    const tool = new ShellTool();
    const result = await tool.execute({ command: 'nonexistentcommand12345' });
    expect(result.success).toBe(false);
  });

  it('should fail without a command', async () => {
    const tool = new ShellTool();
    const result = await tool.execute({});
    expect(result.success).toBe(false);
  });
});

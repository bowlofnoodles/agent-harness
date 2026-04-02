import { describe, it, expect, beforeEach } from 'vitest';
import { TaskQueue } from '../../src/core/task-queue.js';
import type { TaskResult } from '../../src/types.js';

describe('TaskQueue', () => {
  let queue: TaskQueue;

  beforeEach(() => {
    queue = new TaskQueue(2);
  });

  it('should enqueue a task', () => {
    const task = queue.enqueue('test-task', 'A test task');

    expect(task.id).toBeDefined();
    expect(task.name).toBe('test-task');
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('normal');
  });

  it('should assign correct priority ordering', () => {
    queue.enqueue('low', 'Low priority', { priority: 'low' });
    queue.enqueue('critical', 'Critical priority', { priority: 'critical' });
    queue.enqueue('high', 'High priority', { priority: 'high' });

    const tasks = queue.getAllTasks();
    expect(tasks[0].name).toBe('critical');
    expect(tasks[1].name).toBe('high');
    expect(tasks[2].name).toBe('low');
  });

  it('should process tasks with a handler', async () => {
    const results: string[] = [];

    queue.setHandler(async (task): Promise<TaskResult> => {
      results.push(task.name);
      return {
        success: true,
        output: `Processed ${task.name}`,
        errors: [],
        artifacts: [],
        duration: 0,
      };
    });

    queue.enqueue('task-1', 'First task');
    queue.enqueue('task-2', 'Second task');

    // Start processing (it will stop when queue is empty)
    await queue.start();

    expect(results).toContain('task-1');
    expect(results).toContain('task-2');
  });

  it('should report queue statistics', async () => {
    queue.setHandler(async (): Promise<TaskResult> => ({
      success: true,
      output: 'ok',
      errors: [],
      artifacts: [],
      duration: 0,
    }));

    queue.enqueue('task-1', 'First task');

    const statsBefore = queue.getStats();
    expect(statsBefore.pending).toBe(1);
    expect(statsBefore.running).toBe(0);

    await queue.start();

    const statsAfter = queue.getStats();
    expect(statsAfter.pending).toBe(0);
    expect(statsAfter.completed).toBe(1);
  });

  it('should get a task by ID', () => {
    const task = queue.enqueue('find-me', 'Find this task');

    const found = queue.getTask(task.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('find-me');
  });

  it('should emit events when tasks are processed', async () => {
    const events: string[] = [];

    queue.on('task:queued', () => events.push('queued'));
    queue.on('task:started', () => events.push('started'));
    queue.on('task:completed', () => events.push('completed'));

    queue.setHandler(async (): Promise<TaskResult> => ({
      success: true,
      output: 'ok',
      errors: [],
      artifacts: [],
      duration: 0,
    }));

    queue.enqueue('event-task', 'Test events');
    await queue.start();

    expect(events).toContain('queued');
    expect(events).toContain('started');
    expect(events).toContain('completed');
  });

  it('should handle task failures', async () => {
    queue.setHandler(async (): Promise<TaskResult> => ({
      success: false,
      output: '',
      errors: ['Something went wrong'],
      artifacts: [],
      duration: 0,
    }));

    queue.enqueue('failing-task', 'This will fail', { maxRetries: 0 });
    await queue.start();

    const stats = queue.getStats();
    expect(stats.failed).toBeGreaterThan(0);
  });
});

import type { Task, TaskResult, TaskStatus, TaskPriority } from '../types.js';
import { TaskError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'eventemitter3';

type TaskHandler = (task: Task) => Promise<TaskResult>;

/**
 * TaskQueue - Manages the lifecycle of tasks in the agent system.
 *
 * The task queue is central to the harness-engineering pattern. It enables
 * continuous work by maintaining a prioritized queue of tasks, processing
 * them sequentially or concurrently, and handling retries and failures.
 */
export class TaskQueue extends EventEmitter {
  private queue: Task[] = [];
  private running: Map<string, Task> = new Map();
  private completed: Map<string, Task> = new Map();
  private handler: TaskHandler | null = null;
  private maxConcurrent: number;
  private processing = false;

  constructor(maxConcurrent: number = 3) {
    super();
    this.maxConcurrent = maxConcurrent;
  }

  /** Register a task handler that processes tasks */
  setHandler(handler: TaskHandler): void {
    this.handler = handler;
  }

  /** Add a new task to the queue */
  enqueue(
    name: string,
    description: string,
    options: {
      priority?: TaskPriority;
      metadata?: Record<string, unknown>;
      dependencies?: string[];
      maxRetries?: number;
    } = {},
  ): Task {
    const task: Task = {
      id: uuidv4(),
      name,
      description,
      status: 'pending',
      priority: options.priority ?? 'normal',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: options.metadata ?? {},
      dependencies: options.dependencies ?? [],
      retryCount: 0,
      maxRetries: options.maxRetries ?? 3,
    };

    this.queue.push(task);
    this.sortQueue();
    this.emit('task:queued', task);
    logger.info(`Task queued: ${task.name} (${task.id})`);

    return task;
  }

  /** Start processing the queue */
  async start(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    this.emit('queue:started');
    logger.info('Task queue processing started');

    while (this.processing && (this.queue.length > 0 || this.running.size > 0)) {
      await this.processNext();
      // Small delay to prevent tight loop
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.emit('queue:stopped');
    logger.info('Task queue processing stopped');
  }

  /** Stop processing the queue */
  stop(): void {
    this.processing = false;
    logger.info('Task queue processing stopping...');
  }

  /** Process the next available task */
  private async processNext(): Promise<void> {
    if (this.running.size >= this.maxConcurrent) return;
    if (this.queue.length === 0) return;

    const task = this.findNextReady();
    if (!task) return;

    // Remove from queue
    const idx = this.queue.indexOf(task);
    if (idx > -1) this.queue.splice(idx, 1);

    await this.executeTask(task);
  }

  /** Find the next task whose dependencies are all completed */
  private findNextReady(): Task | undefined {
    return this.queue.find(task =>
      task.dependencies.every(depId =>
        this.completed.has(depId) && this.completed.get(depId)?.result?.success,
      ),
    );
  }

  /** Execute a single task */
  private async executeTask(task: Task): Promise<void> {
    if (!this.handler) {
      throw new TaskError(task.id, 'No task handler registered');
    }

    task.status = 'running';
    task.startedAt = new Date();
    task.updatedAt = new Date();
    this.running.set(task.id, task);
    this.emit('task:started', task);
    logger.info(`Task started: ${task.name} (${task.id})`);

    const startTime = Date.now();

    try {
      const result = await this.handler(task);
      task.result = { ...result, duration: Date.now() - startTime };
      task.status = result.success ? 'completed' : 'failed';
    } catch (error) {
      task.result = {
        success: false,
        output: '',
        errors: [error instanceof Error ? error.message : String(error)],
        artifacts: [],
        duration: Date.now() - startTime,
      };
      task.status = 'failed';
    }

    task.completedAt = new Date();
    task.updatedAt = new Date();
    this.running.delete(task.id);
    this.completed.set(task.id, task);

    if (task.status === 'failed' && task.retryCount < task.maxRetries) {
      task.retryCount++;
      task.status = 'pending';
      this.queue.push(task);
      this.sortQueue();
      this.emit('task:retrying', task);
      logger.warn(`Task retrying (${task.retryCount}/${task.maxRetries}): ${task.name}`);
    } else {
      const eventName = task.status === 'completed' ? 'task:completed' : 'task:failed';
      this.emit(eventName, task);
      logger.info(`Task ${task.status}: ${task.name} (${task.result.duration}ms)`);
    }
  }

  /** Sort queue by priority */
  private sortQueue(): void {
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };
    this.queue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /** Update a task's status */
  updateStatus(taskId: string, status: TaskStatus): void {
    const task = this.getTask(taskId);
    if (task) {
      task.status = status;
      task.updatedAt = new Date();
    }
  }

  /** Get a task by ID */
  getTask(id: string): Task | undefined {
    return (
      this.queue.find(t => t.id === id) ??
      this.running.get(id) ??
      this.completed.get(id)
    );
  }

  /** Get queue statistics */
  getStats(): { pending: number; running: number; completed: number; failed: number } {
    const completedTasks = Array.from(this.completed.values());
    return {
      pending: this.queue.length,
      running: this.running.size,
      completed: completedTasks.filter(t => t.status === 'completed').length,
      failed: completedTasks.filter(t => t.status === 'failed').length,
    };
  }

  /** Get all tasks in all states */
  getAllTasks(): Task[] {
    return [
      ...this.queue,
      ...Array.from(this.running.values()),
      ...Array.from(this.completed.values()),
    ];
  }
}

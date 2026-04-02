import type { HarnessConfig, Task, TaskResult } from '../types.js';
import { Memory } from './memory.js';
import { TaskQueue } from './task-queue.js';
import { ToolRegistry } from '../tools/index.js';
import { ScaffoldRegistry } from '../scaffolds/index.js';
import { ValidationPipeline } from '../validation/index.js';
import { logger } from '../utils/logger.js';
import EventEmitter from 'eventemitter3';

/**
 * Agent - The central orchestrator of the harness-engineering system.
 *
 * The Agent ties together all subsystems:
 * - TaskQueue: for continuous task processing
 * - Memory: for persistent knowledge
 * - ToolRegistry: for extensible tool capabilities
 * - ScaffoldRegistry: for project generation
 * - ValidationPipeline: for quality assurance
 *
 * It implements the agent loop pattern:
 * 1. Receive task from queue
 * 2. Plan execution using memory and context
 * 3. Execute using tools
 * 4. Validate results
 * 5. Store learnings in memory
 * 6. Report results
 */
export class Agent extends EventEmitter {
  public readonly config: HarnessConfig;
  public readonly memory: Memory;
  public readonly taskQueue: TaskQueue;
  public readonly tools: ToolRegistry;
  public readonly scaffolds: ScaffoldRegistry;
  public readonly validation: ValidationPipeline;

  private running = false;

  constructor(config: HarnessConfig) {
    super();
    this.config = config;
    this.memory = new Memory(config.memoryPath);
    this.taskQueue = new TaskQueue(config.maxConcurrentTasks);
    this.tools = new ToolRegistry();
    this.scaffolds = new ScaffoldRegistry(config.projectRoot);
    this.validation = new ValidationPipeline(config);

    // Wire up the task handler
    this.taskQueue.setHandler(this.handleTask.bind(this));

    // Forward events
    this.taskQueue.on('task:completed', (task: Task) => {
      this.emit('task:completed', task);
    });
    this.taskQueue.on('task:failed', (task: Task) => {
      this.emit('task:failed', task);
    });
  }

  /** Initialize the agent and all subsystems */
  async initialize(): Promise<void> {
    logger.info('Initializing Agent Harness...');

    // Load persistent memory
    await this.memory.load();

    // Register built-in tools
    this.tools.registerDefaults();

    // Register built-in scaffolds
    this.scaffolds.registerDefaults();

    logger.info(`Agent initialized: ${this.memory.size} memories, ${this.tools.count} tools, ${this.scaffolds.count} scaffolds`);
    this.emit('agent:initialized');
  }

  /** Start the agent loop */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.emit('agent:started');
    logger.info('Agent Harness started');

    await this.taskQueue.start();
  }

  /** Stop the agent loop gracefully */
  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;
    this.taskQueue.stop();

    // Save memory before shutdown
    await this.memory.save();

    this.emit('agent:stopped');
    logger.info('Agent Harness stopped');
  }

  /** Handle a single task through the agent loop */
  private async handleTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const artifacts: string[] = [];
    let output = '';

    try {
      // Phase 1: Planning - Retrieve relevant context from memory
      const context = this.memory.search(task.name);
      if (context.length > 0) {
        logger.debug(`Found ${context.length} relevant memories for task: ${task.name}`);
      }

      // Phase 2: Execution - Use the appropriate tool
      const toolName = task.metadata.tool as string | undefined;
      if (toolName && this.tools.has(toolName)) {
        const tool = this.tools.get(toolName)!;
        const toolResult = await tool.execute(task.metadata);
        output = toolResult.output;
        if (!toolResult.success) {
          errors.push(...toolResult.errors);
        }
      } else {
        output = `Task "${task.name}" processed successfully`;
      }

      // Phase 3: Validation
      if (this.config.validation.lintOnSave && artifacts.length > 0) {
        const validationResults = await this.validation.runAll(artifacts);
        for (const result of validationResults) {
          if (!result.passed) {
            const issueMessages = result.issues
              .filter(i => i.severity === 'error')
              .map(i => i.message);
            errors.push(...issueMessages);
          }
        }
      }

      // Phase 4: Learning - Store any new insights
      if (task.metadata.storeMemory) {
        this.memory.store(
          task.name,
          `Task completed: ${output.substring(0, 200)}`,
          `task:${task.id}`,
          ['task-result'],
        );
      }

      return {
        success: errors.length === 0,
        output,
        errors,
        artifacts,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Task execution failed: ${errorMessage}`);
      return {
        success: false,
        output,
        errors: [...errors, errorMessage],
        artifacts,
        duration: Date.now() - startTime,
      };
    }
  }

  /** Get agent status */
  getStatus(): { running: boolean; queueStats: ReturnType<TaskQueue['getStats']>; memorySize: number } {
    return {
      running: this.running,
      queueStats: this.taskQueue.getStats(),
      memorySize: this.memory.size,
    };
  }
}

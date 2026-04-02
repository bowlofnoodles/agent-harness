import chalk from 'chalk';
import { loadConfig } from '../config/index.js';
import { Agent } from '../core/agent.js';
import type { Task } from '../types.js';

interface RunOptions {
  once?: boolean;
}

export async function runCommand(options: RunOptions): Promise<void> {
  console.log(chalk.blue('\n🚀 Agent Harness Runner\n'));

  try {
    const config = await loadConfig(process.cwd());
    const agent = new Agent(config);
    await agent.initialize();

    // Set up event listeners for real-time feedback
    agent.on('task:completed', (task: Task) => {
      console.log(chalk.green(`  ✅ Task completed: ${task.name}`));
    });

    agent.on('task:failed', (task: Task) => {
      console.log(chalk.red(`  ❌ Task failed: ${task.name}`));
      if (task.result?.errors.length) {
        for (const err of task.result.errors) {
          console.log(chalk.red(`     ${err}`));
        }
      }
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log(chalk.yellow('\n\n⏹️  Shutting down...'));
      await agent.stop();
      console.log(chalk.green('  Agent stopped gracefully.\n'));
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    if (options.once) {
      // Process one task and exit
      const task = agent.taskQueue.enqueue('single-run', 'Single task execution', {
        metadata: { storeMemory: true },
      });

      console.log(chalk.gray(`  Processing task: ${task.name} (${task.id})`));
      await agent.start();
      await agent.stop();
    } else {
      console.log(chalk.gray('  Agent loop started. Press Ctrl+C to stop.\n'));
      console.log(chalk.gray('  Waiting for tasks...\n'));

      // Start the continuous agent loop
      await agent.start();
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

import path from 'path';
import chalk from 'chalk';
import { initConfig } from '../config/index.js';
import fs from 'fs-extra';

interface InitOptions {
  name?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const projectRoot = process.cwd();
  const projectName = options.name ?? path.basename(projectRoot);

  console.log(chalk.blue('\n🔧 Initializing Agent Harness...\n'));

  try {
    // Check if already initialized
    const configPath = path.join(projectRoot, '.harness.yaml');
    if (await fs.pathExists(configPath)) {
      console.log(chalk.yellow('⚠️  Agent Harness is already initialized in this directory.'));
      console.log(chalk.gray(`   Config: ${configPath}`));
      return;
    }

    // Initialize config
    const config = await initConfig(projectRoot);
    config.projectName = projectName;

    // Create .harness directory structure
    const harnessDir = path.join(projectRoot, '.harness');
    await fs.ensureDir(harnessDir);
    await fs.writeFile(
      path.join(harnessDir, 'memory.json'),
      '[]',
      'utf-8',
    );

    console.log(chalk.green('✅ Agent Harness initialized successfully!\n'));
    console.log(chalk.white('  Created:'));
    console.log(chalk.gray('    .harness.yaml          - Configuration file'));
    console.log(chalk.gray('    .harness/memory.json    - Agent memory store'));
    console.log(chalk.gray('    .harness/agent.log      - Agent log file\n'));
    console.log(chalk.white('  Next steps:'));
    console.log(chalk.cyan('    agent-harness scaffold  - Generate a project scaffold'));
    console.log(chalk.cyan('    agent-harness status    - View agent status'));
    console.log(chalk.cyan('    agent-harness run       - Start agent loop\n'));
  } catch (error) {
    console.error(chalk.red(`\n❌ Initialization failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

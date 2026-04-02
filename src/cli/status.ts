import chalk from 'chalk';
import { loadConfig } from '../config/index.js';
import { Agent } from '../core/agent.js';

export async function statusCommand(): Promise<void> {
  console.log(chalk.blue('\n📊 Agent Harness Status\n'));

  try {
    const config = await loadConfig(process.cwd());
    const agent = new Agent(config);
    await agent.initialize();

    const status = agent.getStatus();

    console.log(chalk.white('  Project:'), chalk.cyan(config.projectName));
    console.log(chalk.white('  Root:   '), chalk.gray(config.projectRoot));
    console.log(chalk.white('  Agent:  '), status.running ? chalk.green('Running') : chalk.yellow('Stopped'));
    console.log('');

    console.log(chalk.white('  Queue Statistics:'));
    console.log(chalk.gray(`    Pending:   ${status.queueStats.pending}`));
    console.log(chalk.gray(`    Running:   ${status.queueStats.running}`));
    console.log(chalk.green(`    Completed: ${status.queueStats.completed}`));
    console.log(chalk.red(`    Failed:    ${status.queueStats.failed}`));
    console.log('');

    console.log(chalk.white('  Memory:'), chalk.gray(`${status.memorySize} entries`));
    console.log('');

    console.log(chalk.white('  Tools:'));
    for (const tool of agent.tools.getAll()) {
      console.log(chalk.gray(`    ${tool.name} - ${tool.description}`));
    }
    console.log('');

    console.log(chalk.white('  Scaffolds:'));
    for (const sc of agent.scaffolds.getConfigs()) {
      console.log(chalk.gray(`    ${sc.name} - ${sc.description} [${sc.type}]`));
    }
    console.log('');

    console.log(chalk.white('  Validation:'));
    console.log(chalk.gray(`    Lint on save:    ${config.validation.lintOnSave ? '✅' : '❌'}`));
    console.log(chalk.gray(`    Test on commit:  ${config.validation.testOnCommit ? '✅' : '❌'}`));
    console.log(chalk.gray(`    Security scan:   ${config.validation.securityScan ? '✅' : '❌'}`));
    console.log('');
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
    console.log(chalk.gray('   Run "agent-harness init" to initialize first.'));
    process.exit(1);
  }
}

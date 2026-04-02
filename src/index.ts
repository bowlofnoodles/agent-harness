#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './cli/init.js';
import { scaffoldCommand } from './cli/scaffold.js';
import { statusCommand } from './cli/status.js';
import { runCommand } from './cli/run.js';

const program = new Command();

program
  .name('agent-harness')
  .description('Full-stack project scaffolding tool powered by harness-engineering architecture')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize Agent Harness in the current directory')
  .option('-n, --name <name>', 'Project name')
  .action(initCommand);

program
  .command('scaffold')
  .alias('s')
  .description('Generate a new project scaffold')
  .option('-t, --template <template>', 'Scaffold template (react, express, nextjs)')
  .option('-n, --name <name>', 'Project name')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(scaffoldCommand);

program
  .command('status')
  .description('Show agent status and queue information')
  .action(statusCommand);

program
  .command('run')
  .description('Start the agent loop for continuous processing')
  .option('--once', 'Process one task and exit')
  .action(runCommand);

program.parse();

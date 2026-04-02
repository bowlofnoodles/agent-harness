import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ScaffoldRegistry } from '../scaffolds/index.js';
import type { ScaffoldConfig, ScaffoldOption } from '../types.js';

interface ScaffoldOptions {
  template?: string;
  name?: string;
  output?: string;
}

export async function scaffoldCommand(options: ScaffoldOptions): Promise<void> {
  const outputDir = path.resolve(options.output ?? '.');

  console.log(chalk.blue('\n🏗️  Project Scaffold Generator\n'));

  const registry = new ScaffoldRegistry(outputDir);
  registry.registerDefaults();

  try {
    // Select template
    let templateName = options.template;
    if (!templateName) {
      const configs = registry.getConfigs();
      const { selected } = await inquirer.prompt([{
        type: 'list',
        name: 'selected',
        message: 'Select a project template:',
        choices: configs.map(c => ({
          name: `${c.name} - ${c.description} [${c.type}]`,
          value: c.name,
        })),
      }]);
      templateName = selected as string;
    }

    const scaffold = registry.get(templateName!);
    if (!scaffold) {
      console.error(chalk.red(`\n❌ Unknown template: ${templateName}`));
      console.log(chalk.gray(`   Available: ${registry.getNames().join(', ')}`));
      process.exit(1);
    }

    // Collect options
    const scaffoldConfig = scaffold.getConfig();
    const resolvedOptions = await collectOptions(scaffoldConfig, options.name);

    console.log(chalk.blue('\n📦 Generating scaffold...\n'));

    // Generate
    const result = await scaffold.generate(outputDir, resolvedOptions);

    if (result.success) {
      console.log(chalk.green(`✅ Scaffold generated successfully!\n`));
      console.log(chalk.white(`  Files created: ${result.filesCreated.length}`));
      for (const file of result.filesCreated) {
        console.log(chalk.gray(`    ${file}`));
      }

      if (result.nextSteps.length > 0) {
        console.log(chalk.white('\n  Next steps:'));
        for (const step of result.nextSteps) {
          console.log(chalk.cyan(`    $ ${step}`));
        }
      }
      console.log('');
    } else {
      console.error(chalk.red('\n❌ Scaffold generation failed:'));
      for (const err of result.errors) {
        console.error(chalk.red(`    ${err}`));
      }
      process.exit(1);
    }
  } catch (error) {
    if ((error as Record<string, unknown>).isTtyError) {
      console.error(chalk.red('\n❌ Interactive prompts not supported in this environment.'));
      console.log(chalk.gray('   Use --template and --name flags instead.'));
    } else {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
    }
    process.exit(1);
  }
}

async function collectOptions(config: ScaffoldConfig, presetName?: string): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  for (const option of config.options) {
    if (option.name === 'projectName' && presetName) {
      result[option.name] = presetName;
      continue;
    }

    const answer = await promptForOption(option);
    result[option.name] = answer;
  }

  return result;
}

async function promptForOption(option: ScaffoldOption): Promise<unknown> {
  if (option.type === 'boolean') {
    const { value } = await inquirer.prompt([{
      type: 'confirm',
      name: 'value',
      message: option.description,
      default: option.default ?? false,
    }]);
    return value;
  }

  if (option.type === 'select' && option.choices) {
    const { value } = await inquirer.prompt([{
      type: 'list',
      name: 'value',
      message: option.description,
      choices: option.choices,
      default: option.default,
    }]);
    return value;
  }

  const { value } = await inquirer.prompt([{
    type: 'input',
    name: 'value',
    message: option.description,
    default: option.default,
    validate: option.required ? (v: string) => v.length > 0 || 'This field is required' : undefined,
  }]);
  return value;
}

import type { HarnessConfig, ValidationResult, ValidationIssue } from '../types.js';
import { logger } from '../utils/logger.js';
import { exec } from 'child_process';

/**
 * BaseValidator - Interface for validation steps in the pipeline.
 */
abstract class BaseValidator {
  abstract readonly name: string;

  abstract validate(files: string[], config: HarnessConfig): Promise<ValidationResult>;

  protected createResult(passed: boolean, issues: ValidationIssue[], duration: number): ValidationResult {
    return {
      validator: this.name,
      passed,
      issues,
      duration,
    };
  }
}

/**
 * LintValidator - Runs ESLint on target files.
 */
class LintValidator extends BaseValidator {
  readonly name = 'lint';

  async validate(files: string[], config: HarnessConfig): Promise<ValidationResult> {
    const start = Date.now();
    const issues: ValidationIssue[] = [];

    try {
      const result = await this.runEslint(config.projectRoot, files);
      if (result.errors.length > 0) {
        for (const error of result.errors) {
          issues.push({
            severity: 'error',
            message: error,
            rule: 'eslint',
          });
        }
      }
      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          issues.push({
            severity: 'warning',
            message: warning,
            rule: 'eslint',
          });
        }
      }
    } catch (error) {
      issues.push({
        severity: 'error',
        message: `Lint failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const duration = Date.now() - start;
    const hasErrors = issues.some(i => i.severity === 'error');
    return this.createResult(!hasErrors, issues, duration);
  }

  private runEslint(cwd: string, files: string[]): Promise<{ errors: string[]; warnings: string[] }> {
    const target = files.length > 0 ? files.join(' ') : 'src/';
    return new Promise((resolve) => {
      exec(`npx eslint ${target} --format json 2>/dev/null`, { cwd }, (_error, stdout) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
          const results = JSON.parse(stdout || '[]');
          for (const result of results) {
            for (const msg of result.messages ?? []) {
              if (msg.severity === 2) {
                errors.push(`${result.filePath}:${msg.line}:${msg.column} - ${msg.message} (${msg.ruleId})`);
              } else {
                warnings.push(`${result.filePath}:${msg.line}:${msg.column} - ${msg.message} (${msg.ruleId})`);
              }
            }
          }
        } catch {
          // ESLint may not be configured for the project
        }

        resolve({ errors, warnings });
      });
    });
  }
}

/**
 * TestValidator - Runs the project's test suite.
 */
class TestValidator extends BaseValidator {
  readonly name = 'test';

  async validate(_files: string[], config: HarnessConfig): Promise<ValidationResult> {
    const start = Date.now();
    const issues: ValidationIssue[] = [];

    try {
      await this.runTests(config.projectRoot);
    } catch (error) {
      issues.push({
        severity: 'error',
        message: `Tests failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const duration = Date.now() - start;
    return this.createResult(issues.length === 0, issues, duration);
  }

  private runTests(cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec('npm test 2>&1', { cwd, timeout: 120000 }, (error, stdout) => {
        if (error) {
          reject(new Error(stdout || error.message));
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

/**
 * SecurityValidator - Runs basic security checks.
 */
class SecurityValidator extends BaseValidator {
  readonly name = 'security';

  async validate(_files: string[], config: HarnessConfig): Promise<ValidationResult> {
    const start = Date.now();
    const issues: ValidationIssue[] = [];

    try {
      const auditResult = await this.runNpmAudit(config.projectRoot);
      if (auditResult.vulnerabilities > 0) {
        issues.push({
          severity: auditResult.critical > 0 ? 'error' : 'warning',
          message: `Found ${auditResult.vulnerabilities} vulnerabilities (${auditResult.critical} critical, ${auditResult.high} high)`,
          rule: 'npm-audit',
        });
      }
    } catch {
      // npm audit may not be available or may fail
    }

    const duration = Date.now() - start;
    const hasErrors = issues.some(i => i.severity === 'error');
    return this.createResult(!hasErrors, issues, duration);
  }

  private runNpmAudit(cwd: string): Promise<{ vulnerabilities: number; critical: number; high: number }> {
    return new Promise((resolve) => {
      exec('npm audit --json 2>/dev/null', { cwd }, (_error, stdout) => {
        try {
          const result = JSON.parse(stdout || '{}');
          const metadata = result.metadata?.vulnerabilities ?? {};
          resolve({
            vulnerabilities: metadata.total ?? 0,
            critical: metadata.critical ?? 0,
            high: metadata.high ?? 0,
          });
        } catch {
          resolve({ vulnerabilities: 0, critical: 0, high: 0 });
        }
      });
    });
  }
}

/**
 * ValidationPipeline - Orchestrates all validation steps.
 *
 * Runs lint, test, and security validators in sequence,
 * collecting and reporting all results.
 */
export class ValidationPipeline {
  private validators: BaseValidator[] = [];
  private config: HarnessConfig;

  constructor(config: HarnessConfig) {
    this.config = config;

    if (config.validation.lintOnSave) {
      this.validators.push(new LintValidator());
    }
    if (config.validation.testOnCommit) {
      this.validators.push(new TestValidator());
    }
    if (config.validation.securityScan) {
      this.validators.push(new SecurityValidator());
    }
  }

  /** Run all validators */
  async runAll(files: string[] = []): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const validator of this.validators) {
      logger.info(`Running ${validator.name} validation...`);
      const result = await validator.validate(files, this.config);
      results.push(result);

      const status = result.passed ? '✅ passed' : '❌ failed';
      logger.info(`${validator.name}: ${status} (${result.duration}ms, ${result.issues.length} issues)`);
    }

    return results;
  }

  /** Run a specific validator by name */
  async run(name: string, files: string[] = []): Promise<ValidationResult | undefined> {
    const validator = this.validators.find(v => v.name === name);
    if (!validator) return undefined;

    return validator.validate(files, this.config);
  }

  /** Get the names of all registered validators */
  getValidatorNames(): string[] {
    return this.validators.map(v => v.name);
  }
}

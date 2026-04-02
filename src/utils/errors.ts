/** Base error class for Agent Harness */
export class HarnessError extends Error {
  public readonly code: string;
  public readonly context: Record<string, unknown>;

  constructor(message: string, code: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = 'HarnessError';
    this.code = code;
    this.context = context;
  }
}

/** Error thrown when a task fails */
export class TaskError extends HarnessError {
  constructor(taskId: string, message: string, context: Record<string, unknown> = {}) {
    super(message, 'TASK_ERROR', { taskId, ...context });
    this.name = 'TaskError';
  }
}

/** Error thrown when a tool execution fails */
export class ToolError extends HarnessError {
  constructor(toolName: string, message: string, context: Record<string, unknown> = {}) {
    super(message, 'TOOL_ERROR', { toolName, ...context });
    this.name = 'ToolError';
  }
}

/** Error thrown when scaffold generation fails */
export class ScaffoldError extends HarnessError {
  constructor(scaffoldName: string, message: string, context: Record<string, unknown> = {}) {
    super(message, 'SCAFFOLD_ERROR', { scaffoldName, ...context });
    this.name = 'ScaffoldError';
  }
}

/** Error thrown when validation fails */
export class ValidationError extends HarnessError {
  constructor(validator: string, message: string, context: Record<string, unknown> = {}) {
    super(message, 'VALIDATION_ERROR', { validator, ...context });
    this.name = 'ValidationError';
  }
}

/** Error thrown for configuration issues */
export class ConfigError extends HarnessError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 'CONFIG_ERROR', context);
    this.name = 'ConfigError';
  }
}

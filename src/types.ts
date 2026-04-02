/**
 * Core type definitions for the Agent Harness system.
 * These types define the contracts between all system components.
 */

/** Represents the possible states of a task in the queue */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Represents the priority level of a task */
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/** Represents a unit of work for the agent */
export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: TaskResult;
  metadata: Record<string, unknown>;
  dependencies: string[];
  retryCount: number;
  maxRetries: number;
}

/** Result of a completed task */
export interface TaskResult {
  success: boolean;
  output: string;
  errors: string[];
  artifacts: string[];
  duration: number;
}

/** A memory entry stored by the agent */
export interface MemoryEntry {
  id: string;
  subject: string;
  fact: string;
  source: string;
  createdAt: Date;
  tags: string[];
}

/** Configuration for a scaffold template */
export interface ScaffoldConfig {
  name: string;
  description: string;
  type: 'frontend' | 'backend' | 'fullstack' | 'library';
  options: ScaffoldOption[];
}

/** A configurable option for a scaffold */
export interface ScaffoldOption {
  name: string;
  description: string;
  type: 'string' | 'boolean' | 'select';
  default?: string | boolean;
  choices?: string[];
  required: boolean;
}

/** Result of a scaffold generation */
export interface ScaffoldResult {
  success: boolean;
  filesCreated: string[];
  commands: string[];
  errors: string[];
  nextSteps: string[];
}

/** Configuration for a tool */
export interface ToolConfig {
  name: string;
  description: string;
  enabled: boolean;
}

/** Result of a tool execution */
export interface ToolResult {
  success: boolean;
  output: string;
  errors: string[];
}

/** Validation result from the pipeline */
export interface ValidationResult {
  validator: string;
  passed: boolean;
  issues: ValidationIssue[];
  duration: number;
}

/** A single validation issue */
export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  rule?: string;
}

/** Agent harness global configuration */
export interface HarnessConfig {
  projectName: string;
  projectRoot: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  memoryPath: string;
  maxConcurrentTasks: number;
  defaultScaffold: string;
  validation: {
    lintOnSave: boolean;
    testOnCommit: boolean;
    securityScan: boolean;
  };
  git: {
    autoCommit: boolean;
    commitPrefix: string;
    branch: string;
  };
}

/** Event types emitted by the agent system */
export type AgentEvent =
  | 'task:queued'
  | 'task:started'
  | 'task:completed'
  | 'task:failed'
  | 'task:cancelled'
  | 'memory:stored'
  | 'memory:retrieved'
  | 'scaffold:started'
  | 'scaffold:completed'
  | 'validation:started'
  | 'validation:completed'
  | 'agent:started'
  | 'agent:stopped'
  | 'agent:error';

/** Payload for agent events */
export interface AgentEventPayload {
  event: AgentEvent;
  timestamp: Date;
  data: Record<string, unknown>;
}

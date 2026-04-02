# Architecture: Agent Harness

## Overview

Agent Harness is a full-stack project scaffolding tool built on the **harness-engineering** architecture pattern. This pattern enables continuous, autonomous development workflows by combining an agent loop, task queue, persistent memory, extensible tools, and automated validation.

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLI Interface                         │
│              (init / scaffold / status / run)                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Agent (Core)                       │   │
│  │                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │ Task Queue   │  │   Memory    │  │  Config    │  │   │
│  │  │ (Priority +  │  │ (Persistent │  │  (YAML +   │  │   │
│  │  │  Dependencies│  │  Knowledge) │  │   Zod)     │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│              ┌────────────┼────────────┐                     │
│              ▼            ▼            ▼                      │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────────┐         │
│  │ Tool Registry │ │  Scaffold   │ │  Validation  │         │
│  │              │ │  Registry   │ │  Pipeline    │         │
│  │ • filesystem │ │             │ │              │         │
│  │ • shell      │ │ • react     │ │ • lint       │         │
│  │ • git        │ │ • express   │ │ • test       │         │
│  │ • (custom)   │ │ • nextjs    │ │ • security   │         │
│  └──────────────┘ └─────────────┘ └──────────────┘         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Core Concepts

### 1. Agent Loop

The Agent is the central orchestrator. It implements the classic agent loop pattern:

1. **Receive** – Pull the next task from the priority queue
2. **Plan** – Retrieve relevant context from Memory
3. **Execute** – Use the appropriate Tool to perform the work
4. **Validate** – Run the Validation Pipeline on the results
5. **Learn** – Store new insights back into Memory
6. **Report** – Emit events and log results

### 2. Task Queue

The TaskQueue manages work items with:
- **Priority ordering**: critical > high > normal > low
- **Dependency resolution**: Tasks can depend on other tasks
- **Automatic retries**: Failed tasks retry up to `maxRetries` times
- **Concurrent processing**: Configurable concurrency limit
- **Event emission**: Real-time status updates via EventEmitter

### 3. Memory

Persistent knowledge store that survives across sessions:
- **Store** facts, conventions, and patterns
- **Search** by subject, keyword, or tag
- **Load/Save** from/to JSON on disk
- Enables the agent to improve over time

### 4. Tool System

Plugin-based tool architecture:
- **BaseTool** – Abstract interface with execute/validate pattern
- **FileSystemTool** – Read, write, copy, delete files
- **ShellTool** – Execute shell commands with timeout
- **GitTool** – Git operations (init, commit, branch, etc.)
- Extensible: register custom tools at runtime

### 5. Scaffold System

Project template generators:
- **ReactScaffold** – React + TypeScript + Vite (with Tailwind, Router, Zustand/Redux options)
- **ExpressScaffold** – Express + TypeScript REST API (with Prisma, JWT Auth, Docker options)
- **NextjsScaffold** – Next.js 14 App Router fullstack (with Tailwind, Prisma, NextAuth options)
- Each scaffold produces production-ready project structure

### 6. Validation Pipeline

Automated quality assurance:
- **LintValidator** – ESLint with JSON output parsing
- **TestValidator** – Runs project test suite
- **SecurityValidator** – npm audit for vulnerability detection
- Configurable per-project via `.harness.yaml`

### 7. Configuration

YAML-based configuration with Zod schema validation:
```yaml
projectName: my-project
logLevel: info
maxConcurrentTasks: 3
defaultScaffold: nextjs
validation:
  lintOnSave: true
  testOnCommit: true
  securityScan: true
git:
  autoCommit: true
  commitPrefix: "[harness]"
  branch: main
```

## Directory Structure

```
agent-harness/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── types.ts              # Core type definitions
│   ├── cli/                  # CLI command handlers
│   │   ├── init.ts           # Initialize harness
│   │   ├── scaffold.ts       # Generate projects
│   │   ├── status.ts         # Show agent status
│   │   └── run.ts            # Start agent loop
│   ├── core/                 # Harness engine
│   │   ├── agent.ts          # Agent orchestrator
│   │   ├── task-queue.ts     # Task management
│   │   └── memory.ts         # Knowledge store
│   ├── tools/                # Tool system
│   │   ├── base-tool.ts      # Tool interface
│   │   ├── file-system.ts    # File operations
│   │   ├── shell.ts          # Shell execution
│   │   ├── git.ts            # Git operations
│   │   └── index.ts          # Tool registry
│   ├── scaffolds/            # Project generators
│   │   ├── base-scaffold.ts  # Scaffold interface
│   │   ├── react-app.ts      # React template
│   │   ├── express-api.ts    # Express template
│   │   ├── nextjs-app.ts     # Next.js template
│   │   └── index.ts          # Scaffold registry
│   ├── validation/           # Quality assurance
│   │   └── index.ts          # Validation pipeline
│   ├── config/               # Configuration
│   │   └── index.ts          # Config management
│   └── utils/                # Utilities
│       ├── logger.ts         # Winston logging
│       └── errors.ts         # Error classes
├── tests/                    # Unit tests
├── docs/                     # Documentation
│   └── architecture.md       # This file
├── .harness.yaml             # Project config
└── package.json
```

## Extension Points

### Adding a New Tool

```typescript
import { BaseTool } from './tools/base-tool.js';

class MyTool extends BaseTool {
  readonly name = 'my-tool';
  readonly description = 'Does something useful';

  async execute(params: Record<string, unknown>) {
    // Implementation
    return this.success('Done!');
  }
}

// Register
agent.tools.register(new MyTool());
```

### Adding a New Scaffold

```typescript
import { BaseScaffold } from './scaffolds/base-scaffold.js';

class MyScaffold extends BaseScaffold {
  readonly config = {
    name: 'my-scaffold',
    description: 'My custom scaffold',
    type: 'fullstack' as const,
    options: [/* ... */],
  };

  async generate(targetDir, options) {
    // Generate files
    return this.successResult(files, commands, nextSteps);
  }
}

// Register
agent.scaffolds.register(new MyScaffold());
```

## Design Principles

1. **Extensible**: Everything is pluggable – tools, scaffolds, validators
2. **Type-safe**: Full TypeScript with Zod schema validation
3. **Persistent**: Memory survives across sessions for continuous improvement
4. **Observable**: Event-driven with comprehensive logging
5. **Production-ready**: Generated projects include best practices (security headers, rate limiting, error handling, Docker)
6. **Testable**: All core components are unit-testable with no side effects

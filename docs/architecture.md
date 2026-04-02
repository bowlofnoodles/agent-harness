# Architecture: Agent Harness

## Overview

Agent Harness is a full-stack project scaffolding CLI tool built on the **harness-engineering** architecture pattern. It generates production-ready **React + Nest.js** projects that are pre-configured for AI-assisted development with Claude Code and GitHub Copilot.

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLI Interface                            │
│          (init / scaffold / guide / status / run)                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Agent (Core Engine)                    │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │   │
│  │  │ Task Queue   │  │   Memory    │  │    Config      │  │   │
│  │  │ (Priority +  │  │ (Persistent │  │  (.harness.yaml│  │   │
│  │  │  Dependencies│  │  Knowledge) │  │    + Zod)      │  │   │
│  │  │  + Retries)  │  │             │  │                │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│              ┌────────────┼────────────┐                         │
│              ▼            ▼            ▼                          │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────────┐             │
│  │ Tool Registry │ │  Scaffold   │ │  Validation  │             │
│  │              │ │  Registry   │ │  Pipeline    │             │
│  │ • filesystem │ │             │ │              │             │
│  │ • shell      │ │ • react     │ │ • lint       │             │
│  │ • git        │ │ • nestjs    │ │ • test       │             │
│  │ • (custom)   │ │             │ │ • security   │             │
│  └──────────────┘ └─────────────┘ └──────────────┘             │
│                         │                                        │
│                         ▼                                        │
│              ┌──────────────────────┐                            │
│              │  AI Agent Support    │                            │
│              │                      │                            │
│              │ • CLAUDE.md          │                            │
│              │ • copilot-instructions│                           │
│              │ • guide command      │                            │
│              └──────────────────────┘                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
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

Project template generators using **React + Nest.js** stack:

- **ReactScaffold** – React 18 + TypeScript + Vite (with Tailwind, Router, Zustand/Redux options)
- **NestjsScaffold** – Nest.js + TypeScript modular API (with Prisma, JWT Auth, Swagger, Docker options)

Each scaffold generates:
- Production-ready project structure
- `CLAUDE.md` – AI instructions for Claude Code
- `.github/copilot-instructions.md` – AI instructions for GitHub Copilot

### 6. AI Agent Integration

Every generated project is AI-agent-ready:

| File | Purpose | Read by |
|------|---------|---------|
| `CLAUDE.md` | Project context, structure, conventions, commands | Claude Code |
| `.github/copilot-instructions.md` | Code style, architecture rules, patterns | GitHub Copilot |

The `agent-harness guide` command provides step-by-step workflows for each AI agent.

### 7. Validation Pipeline

Automated quality assurance:
- **LintValidator** – ESLint with JSON output parsing
- **TestValidator** – Runs project test suite
- **SecurityValidator** – npm audit for vulnerability detection
- Configurable per-project via `.harness.yaml`

### 8. Configuration

YAML-based configuration with Zod schema validation:
```yaml
projectName: my-project
logLevel: info
maxConcurrentTasks: 3
defaultScaffold: nestjs
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
│   │   ├── guide.ts          # AI agent workflow guides
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
│   │   ├── react-app.ts      # React + Vite template
│   │   ├── nestjs-api.ts     # Nest.js API template
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

## Generated Project Structure

### React Frontend

```
frontend/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component with routing
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Page-level components
│   ├── styles/               # Global styles
│   └── utils/                # Helpers
├── CLAUDE.md                 # AI instructions (Claude Code)
├── .github/
│   └── copilot-instructions.md  # AI instructions (Copilot)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Nest.js Backend

```
backend/
├── src/
│   ├── main.ts               # Bootstrap + Swagger
│   ├── app.module.ts          # Root module
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── health/                # Health check module
│   ├── auth/                  # JWT authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── guards/
│   │   └── dto/
│   ├── prisma/                # Database module
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── common/                # Shared utilities
│       ├── filters/
│       └── interceptors/
├── prisma/
│   └── schema.prisma
├── CLAUDE.md                  # AI instructions (Claude Code)
├── .github/
│   └── copilot-instructions.md  # AI instructions (Copilot)
├── Dockerfile
├── docker-compose.yaml
├── nest-cli.json
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
    // Generate files + CLAUDE.md + copilot-instructions.md
    return this.successResult(files, commands, nextSteps);
  }
}

// Register
agent.scaffolds.register(new MyScaffold());
```

## Design Principles

1. **AI-Native**: Every generated project includes AI agent instruction files
2. **Extensible**: Everything is pluggable – tools, scaffolds, validators
3. **Type-safe**: Full TypeScript with Zod schema validation
4. **Persistent**: Memory survives across sessions for continuous improvement
5. **Observable**: Event-driven with comprehensive logging
6. **Production-ready**: Generated projects include security, validation, Docker, Swagger
7. **Testable**: All core components are unit-testable with no side effects

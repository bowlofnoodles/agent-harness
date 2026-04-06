# Agent Harness

A full-stack project scaffolding CLI tool built on the **harness-engineering** architecture pattern. Generate production-ready **React + Nest.js** projects pre-configured for AI-assisted development with Claude Code and GitHub Copilot.

## Features

- **AI-Native Scaffolding** — Generate projects with built-in AI agent instruction files (`CLAUDE.md`, `.github/copilot-instructions.md`)
- **Harness Agent Loop** — Continuous task processing with priority queuing, dependency management, and automatic retries
- **Persistent Memory** — Knowledge store that survives sessions for continuous learning
- **Tool System** — Extensible file system, shell, and git operations
- **Validation Pipeline** — Built-in lint, test, and security scanning
- **Multiple Scaffolds** — React (frontend) and NestJS (backend) templates

## Installation

```bash
npm install -g @bowlofnoodles/agent-harness
```

Or run directly:

```bash
npx @bowlofnoodles/agent-harness init
```

## Quick Start

```bash
# Initialize in current directory
agent-harness init

# Generate a React frontend
agent-harness scaffold -t react -n my-app

# Generate a NestJS backend
agent-harness scaffold -t nestjs -n my-api

# Inject AI instructions into existing project
agent-harness inject

# View agent status
agent-harness status

# Start continuous agent loop
agent-harness run
```

## CLI Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `init` | — | Initialize Agent Harness in the current directory |
| `scaffold` | `s` | Generate a new project scaffold |
| `inject` | `i` | Inject AI instructions into an existing project |
| `guide` | `g` | Show AI agent workflow guides |
| `status` | — | Display agent status and queue information |
| `run` | — | Start the agent loop for continuous processing |

### Scaffold Templates

#### React (`-t react`)
Modern React 18 + TypeScript + Vite frontend with optional:
- Tailwind CSS
- React Router v6
- State management (Zustand / Redux)

#### NestJS (`-t nestjs`)
NestJS + TypeScript modular API with optional:
- Prisma ORM
- JWT Authentication
- Swagger/OpenAPI documentation
- Docker support

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Interface                          │
│           (init / scaffold / guide / status / run)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Agent (Core Engine)                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │  Task Queue  │  │   Memory    │  │   Config   │  │   │
│  │  │  (Priority + │  │ (Persistent │  │ (.harness. │  │   │
│  │  │  Dependencies│  │  Knowledge) │  │    yaml)   │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│              ┌─────────────┼─────────────┐                 │
│              ▼             ▼             ▼                 │
│  ┌───────────────┐ ┌─────────────┐ ┌───────────────┐     │
│  │  Tool Registry │ │  Scaffold   │ │   Validation  │     │
│  │               │ │  Registry   │ │   Pipeline    │     │
│  │ • filesystem  │ │ • react     │ │ • lint        │     │
│  │ • shell       │ │ • nestjs    │ │ • test         │     │
│  │ • git         │ │             │ │ • security     │     │
│  └───────────────┘ └─────────────┘ └───────────────┘     │
│                            │                                │
│                            ▼                                │
│               ┌────────────────────────┐                    │
│               │   AI Agent Support     │                    │
│               │ • CLAUDE.md            │                    │
│               │ • copilot-instructions│                    │
│               └────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### Agent
The central orchestrator implementing the agent loop: Receive → Plan → Execute → Validate → Learn → Report

#### TaskQueue
Priority-based task processing with:
- Priority ordering: critical > high > normal > low
- Dependency resolution
- Automatic retries (configurable maxRetries)
- Concurrent processing with configurable limits
- Event emission for real-time status updates

#### Memory
Persistent knowledge store that:
- Stores facts, conventions, and patterns
- Supports search by subject, tag, or keyword
- Persists to JSON on disk
- Enables continuous learning across sessions

#### Tool Registry
Plugin-based tool architecture:
- `FileSystemTool` — Read, write, copy, delete files
- `ShellTool` — Execute shell commands with timeout
- `GitTool` — Git operations (init, commit, branch, etc.)
- Extensible: register custom tools at runtime

#### Scaffold Registry
Project template generators:
- `ReactScaffold` — React + TypeScript + Vite
- `NestjsScaffold` — NestJS + TypeScript modular API

#### Validation Pipeline
Automated quality assurance:
- `LintValidator` — ESLint integration
- `TestValidator` — Project test suite runner
- `SecurityValidator` — npm audit vulnerability scanning

## Configuration

Create `.harness.yaml` in your project root:

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

## AI Agent Integration

Every generated project includes AI-ready instruction files:

| File | Purpose | Read by |
|------|---------|---------|
| `CLAUDE.md` | Project context, structure, conventions, commands | Claude Code |
| `.github/copilot-instructions.md` | Code style, architecture rules, patterns | GitHub Copilot |

Use `agent-harness guide` for step-by-step workflows with each AI agent.

## Project Structure

```
src/
├── index.ts              # CLI entry point
├── types.ts              # Core type definitions
├── cli/                  # CLI command handlers
│   ├── init.ts
│   ├── scaffold.ts
│   ├── guide.ts
│   ├── status.ts
│   ├── run.ts
│   └── inject.ts
├── core/                 # Harness engine
│   ├── agent.ts          # Agent orchestrator
│   ├── task-queue.ts     # Task management
│   └── memory.ts         # Knowledge store
├── tools/                # Tool system
│   ├── base-tool.ts
│   ├── file-system.ts
│   ├── shell.ts
│   └── git.ts
├── scaffolds/            # Project generators
│   ├── base-scaffold.ts
│   ├── react-app.ts
│   └── nestjs-api.ts
├── validation/           # Quality assurance
├── config/               # Configuration management
└── utils/                # Logger, errors
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## License

MIT

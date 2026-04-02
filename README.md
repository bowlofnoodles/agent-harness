# Agent Harness

A full-stack project scaffolding CLI tool powered by the **harness-engineering** architecture — designed for continuous development with AI coding agents (Claude Code, GitHub Copilot, etc.).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Nest.js + TypeScript |
| **Database** | Prisma + PostgreSQL |
| **AI Agents** | Claude Code · GitHub Copilot |

## Architecture Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   developer / AI agent (Claude Code, Copilot)                        │
│        │                                                             │
│        ▼                                                             │
│   ┌──────────────┐                                                   │
│   │  agent-harness│  CLI                                             │
│   │  init / scaffold / guide / status / run                          │
│   └──────┬───────┘                                                   │
│          │                                                           │
│   ┌──────┴──────────────────────────────────────┐                    │
│   │              Agent Core Engine               │                   │
│   │  ┌──────────┐ ┌────────┐ ┌───────────────┐  │                   │
│   │  │TaskQueue │ │ Memory │ │    Config      │  │                   │
│   │  │(priority,│ │(persist│ │  (.harness.yaml│  │                   │
│   │  │ deps,    │ │ facts) │ │   + Zod)      │  │                   │
│   │  │ retries) │ │        │ │               │  │                   │
│   │  └──────────┘ └────────┘ └───────────────┘  │                   │
│   └──────┬──────────────────────────────────────┘                    │
│          │                                                           │
│   ┌──────┴──────┬──────────────┬─────────────────┐                   │
│   ▼             ▼              ▼                 ▼                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐             │
│ │  Tools   │ │ Scaffolds│ │Validation│ │ AI Agent     │             │
│ │          │ │          │ │ Pipeline │ │ Instructions │             │
│ │•filesys  │ │• react   │ │          │ │              │             │
│ │•shell    │ │• nestjs  │ │• lint    │ │• CLAUDE.md   │             │
│ │•git      │ │          │ │• test    │ │• copilot-    │             │
│ │•(custom) │ │          │ │• security│ │  instructions│             │
│ └──────────┘ └──────────┘ └──────────┘ └──────────────┘             │
│                    │                                                 │
│                    ▼                                                 │
│   ┌─────────────────────────────────────────┐                        │
│   │       Generated Project (monorepo)       │                       │
│   │                                          │                       │
│   │  frontend/          backend/             │                       │
│   │  ├── src/            ├── src/            │                       │
│   │  │   ├── App.tsx     │   ├── main.ts     │                       │
│   │  │   ├── components/ │   ├── app.module   │                       │
│   │  │   └── pages/      │   ├── auth/       │                       │
│   │  ├── CLAUDE.md       │   ├── health/     │                       │
│   │  └── .github/        │   ├── prisma/     │                       │
│   │     copilot-         │   ├── CLAUDE.md   │                       │
│   │     instructions.md  │   └── .github/    │                       │
│   │                      │      copilot-     │                       │
│   │                      │      instructions │                       │
│   └─────────────────────────────────────────┘                        │
│                    │                                                 │
│                    ▼                                                 │
│          AI agent reads CLAUDE.md /                                  │
│          copilot-instructions.md and                                 │
│          builds features continuously                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Build the CLI tool
npm run build

# Initialize harness config in your project
npx agent-harness init

# Generate a fullstack project (React frontend + Nest.js backend)
npx agent-harness scaffold -t react -n frontend
npx agent-harness scaffold -t nestjs -n backend

# Open with an AI coding agent
cd frontend && claude    # or open in VS Code with Copilot
cd backend  && claude    # AI reads CLAUDE.md for context
```

## CLI Commands

### `agent-harness init`

Initialize Agent Harness configuration in the current directory.

```bash
agent-harness init
agent-harness init -n my-project
```

Creates `.harness.yaml` config and `.harness/` directory.

### `agent-harness scaffold`

Generate a new project scaffold with interactive prompts.

```bash
# Interactive mode
agent-harness scaffold

# Non-interactive mode
agent-harness scaffold -t react -n frontend
agent-harness scaffold -t nestjs -n backend

# Specify output directory
agent-harness scaffold -t nestjs -n api -o ./projects
```

| Template | Type | Description |
|----------|------|-------------|
| `react` | Frontend | React 18 + Vite + TypeScript + Tailwind + React Router + Zustand |
| `nestjs` | Backend | Nest.js + TypeScript + Prisma + JWT Auth + Swagger + Docker |

Each generated project includes:
- `CLAUDE.md` — AI instructions for Claude Code
- `.github/copilot-instructions.md` — AI instructions for GitHub Copilot

### `agent-harness guide`

Show AI agent workflow guides.

```bash
# Overview of all supported AI agents
agent-harness guide

# Detailed guide for a specific agent
agent-harness guide --agent claude-code
agent-harness guide --agent copilot-cli
```

### `agent-harness status`

Show agent status, registered tools, scaffolds, and queue stats.

```bash
agent-harness status
```

### `agent-harness run`

Start the agent loop for continuous task processing.

```bash
agent-harness run           # Continuous mode
agent-harness run --once    # Process one task and exit
```

## AI Agent Workflow

Agent Harness generates projects that are **AI-agent-ready** out of the box. Every scaffolded project includes instruction files that popular AI coding tools read automatically.

### With Claude Code

```bash
# 1. Generate a project
agent-harness scaffold -t nestjs -n backend

# 2. Open with Claude Code
cd backend && claude

# Claude automatically reads CLAUDE.md and understands:
# - Project structure & conventions
# - Available commands
# - How to add new modules
# - Code style rules

# 3. Ask Claude to build features
# "Add a users CRUD module with Prisma model"
# "Write unit tests for the auth service"
# "Create a products endpoint with pagination"
```

### With GitHub Copilot

```bash
# 1. Generate a project
agent-harness scaffold -t react -n frontend

# 2. Open in VS Code (Copilot reads .github/copilot-instructions.md)
cd frontend && code .

# 3. Use Copilot Chat
# @workspace "How do I add a new page?"
# @workspace "Create a user profile component"
# "Explain this React hook"
```

### Workflow Diagram

```
  ┌──────────┐     scaffold      ┌──────────────────┐
  │  agent-  │ ───────────────►  │  Generated        │
  │  harness │                   │  Project          │
  │  CLI     │                   │  ├── CLAUDE.md    │
  └──────────┘                   │  ├── .github/     │
                                 │  │   copilot-     │
                                 │  │   instructions │
       ┌─────────────────────────┤  └── src/...      │
       │                         └──────────────────┘
       ▼                                  │
  ┌──────────┐                            │
  │ AI Agent │◄───────────────────────────┘
  │          │  reads instructions
  │• Claude  │  understands structure
  │  Code    │  builds features
  │• Copilot │  runs tests
  └──────────┘
```

## Development

```bash
# Run the CLI in development mode
npm run dev

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Build
npm run build
```

## Configuration

Agent Harness stores its config in `.harness.yaml`:

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

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full architecture documentation.

## License

MIT

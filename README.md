# Agent Harness

A CLI tool for scaffolding full-stack projects optimized for AI coding agents (Claude Code, GitHub Copilot).

## What It Does

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   agent-harness scaffold -t react -n frontend              │
│   agent-harness scaffold -t nestjs -n backend             │
│                                                             │
│                        ▼                                    │
│   ┌──────────────────────────────────────────────────────┐  │
│   │           Generated Project                          │  │
│   │                                                       │  │
│   │   frontend/                   backend/               │  │
│   │   ├── src/                    ├── src/               │  │
│   │   ├── CLAUDE.md               ├── CLAUDE.md          │  │
│   │   └── .github/                └── .github/            │  │
│   │       copilot-instructions       copilot-instructions │  │
│   └──────────────────────────────────────────────────────┘  │
│                        │                                    │
│                        ▼                                    │
│              AI Agent reads instructions                    │
│              and builds features continuously               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Nest.js + TypeScript |
| **Database** | Prisma + PostgreSQL |
| **AI Agents** | Claude Code · GitHub Copilot |

## Quick Start

```bash
# Install globally
npm install -g @bowlofnoodles/agent-harness

# Scaffold a project
npx agent-harness scaffold -t react -n frontend
npx agent-harness scaffold -t nestjs -n backend

# Open with an AI coding agent
cd frontend && claude    # Claude reads CLAUDE.md automatically
cd backend  && claude
```

## CLI Commands

### `agent-harness scaffold`

Generate a new project scaffold.

```bash
# Interactive mode
agent-harness scaffold

# Non-interactive mode
agent-harness scaffold -t react -n frontend
agent-harness scaffold -t nestjs -n backend -o ./projects
```

| Template | Type | Description |
|----------|------|-------------|
| `react` | Frontend | React 18 + Vite + TypeScript + Tailwind + React Router + Zustand |
| `nestjs` | Backend | Nest.js + TypeScript + Prisma + JWT Auth + Swagger + Docker |

Each generated project includes AI instruction files:
- `CLAUDE.md` — instructions for Claude Code
- `.github/copilot-instructions.md` — instructions for GitHub Copilot

### `agent-harness init`

Initialize Agent Harness configuration in the current directory.

```bash
agent-harness init
agent-harness init -n my-project
```

Creates `.harness.yaml` config and `.harness/` directory.

### `agent-harness guide`

Show AI agent workflow guides.

```bash
agent-harness guide                           # Overview of all agents
agent-harness guide --agent claude-code       # Detailed guide
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

### With Claude Code

```bash
agent-harness scaffold -t nestjs -n backend
cd backend && claude
```

Claude automatically reads `CLAUDE.md` and understands project structure, conventions, and commands.

### With GitHub Copilot

```bash
agent-harness scaffold -t react -n frontend
cd frontend && code .
```

Copilot reads `.github/copilot-instructions.md` automatically.

## Development

```bash
npm install
npm run build
npm run dev        # Run CLI in development mode
npm test           # Run all tests
npm run test:watch # Watch mode
npm run lint
```

## Configuration

`.harness.yaml`:

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

See [docs/architecture.md](docs/architecture.md) for full documentation.

## License

MIT

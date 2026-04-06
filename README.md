# @bowlofnoodles/agent-harness

[![npm version](https://img.shields.io/npm/v/@bowlofnoodles/agent-harness?style=flat-square)](https://www.npmjs.com/package/@bowlofnoodles/agent-harness)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)](https://www.typescriptlang.org/)

A CLI tool that scaffolds full-stack projects pre-configured for AI coding agents (Claude Code, GitHub Copilot). Each generated project includes AI instruction files (`CLAUDE.md`, `copilot-instructions.md`) so agents understand the codebase from day one.

## Features

- **AI-Ready Scaffolds** — Generate React or NestJS projects with built-in AI context files
- **Harness Engine** — Task queue, persistent memory, and validation pipeline for autonomous development
- **Tool System** — File system, shell, and git operations extensible at runtime
- **Validation Pipeline** — Lint, test, and security checks on every change
- **Zero Config** — Works out of the box, configure via `.harness.yaml` when needed

## Tech Stack

| Layer | Technology |
|-------|-----------|
| CLI | TypeScript + Commander.js |
| Frontend Scaffold | React 18 + Vite + TypeScript |
| Backend Scaffold | NestJS + Prisma + PostgreSQL |

## Quick Start

```bash
# Install
npm install -g @bowlofnoodles/agent-harness

# Initialize harness in your project
npx agent-harness init

# Scaffold a full-stack project
npx agent-harness scaffold -t react -n frontend
npx agent-harness scaffold -t nestjs -n backend

# Open with an AI agent
cd frontend && claude   # reads CLAUDE.md automatically
cd backend  && claude
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `agent-harness init` | Initialize harness config (`.harness.yaml`) |
| `agent-harness scaffold -t <type> -n <name>` | Generate project scaffold |
| `agent-harness guide` | Show AI agent workflow guides |
| `agent-harness status` | Display agent status, tools, and queue stats |
| `agent-harness run` | Start the agent loop for continuous task processing |

### Scaffold Templates

| Template | Description |
|----------|-------------|
| `react` | React 18 + Vite + TypeScript + Tailwind + React Router + Zustand |
| `nestjs` | NestJS + TypeScript + Prisma + JWT + Swagger + Docker |

## Project Structure

```
my-project/
├── frontend/                 # React scaffold
│   ├── src/
│   ├── CLAUDE.md            # AI context for Claude Code
│   └── .github/
│       └── copilot-instructions.md  # AI context for Copilot
├── backend/                  # NestJS scaffold
│   ├── src/
│   ├── prisma/
│   ├── CLAUDE.md
│   └── .github/
│       └── copilot-instructions.md
└── .harness.yaml            # Harness configuration
```

## AI Agent Workflow

After scaffolding, AI agents read the instruction files automatically:

**Claude Code** reads `CLAUDE.md` which contains:
- Project structure and conventions
- Available npm scripts and commands
- How to add new modules
- Code style rules

**GitHub Copilot** reads `.github/copilot-instructions.md` which contains:
- Architecture patterns
- Code style guidelines
- Common development workflows

```bash
# Example: Ask Claude to build a feature
cd backend && claude
> "Add a users CRUD module with Prisma"

# Example: Ask Copilot via VS Code
# @workspace "How do I add a new page?"
```

## Configuration

Create `.harness.yaml` in your project root:

```yaml
projectName: my-project
logLevel: info
maxConcurrentTasks: 3
validation:
  lintOnSave: true
  testOnCommit: true
  securityScan: true
git:
  autoCommit: true
  commitPrefix: "[harness]"
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full architecture documentation.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run CLI locally
npm run dev -- init -n my-project

# Test
npm test

# Lint
npm run lint
```

## License

MIT

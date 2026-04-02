# Agent Harness

A full-stack project scaffolding tool powered by the **harness-engineering** architecture pattern — designed for continuous, autonomous development workflows.

## Features

- 🏗️ **Project Scaffolding** — Generate production-ready projects with one command
  - **React** + TypeScript + Vite (Tailwind, React Router, Zustand/Redux)
  - **Express** + TypeScript REST API (Prisma, JWT Auth, Docker)
  - **Next.js 14** App Router fullstack (Tailwind, Prisma, NextAuth)
- 🤖 **Agent Loop** — Continuous task processing with priority queue
- 🧠 **Persistent Memory** — Knowledge store that survives across sessions
- 🔧 **Extensible Tools** — Plugin-based tool system (FileSystem, Shell, Git)
- ✅ **Validation Pipeline** — Automated lint, test, and security checks
- ⚙️ **YAML Configuration** — Zod-validated project configuration

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Initialize in your project
npx agent-harness init

# Generate a new project scaffold
npx agent-harness scaffold

# Check agent status
npx agent-harness status

# Start the agent loop
npx agent-harness run
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `agent-harness init` | Initialize Agent Harness in the current directory |
| `agent-harness scaffold` | Generate a new project scaffold (interactive) |
| `agent-harness scaffold -t nextjs -n my-app` | Generate with specific template and name |
| `agent-harness status` | Show agent status, tools, and queue info |
| `agent-harness run` | Start the continuous agent loop |
| `agent-harness run --once` | Process one task and exit |

## Scaffold Templates

### React App
```bash
agent-harness scaffold -t react -n my-frontend
```
Generates: React 18 + TypeScript + Vite + optional Tailwind/Router/State management

### Express API
```bash
agent-harness scaffold -t express -n my-api
```
Generates: Express + TypeScript + optional Prisma/JWT Auth/Docker/Rate limiting

### Next.js Fullstack
```bash
agent-harness scaffold -t nextjs -n my-app
```
Generates: Next.js 14 App Router + TypeScript + optional Tailwind/Prisma/NextAuth

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

```
CLI → Agent → TaskQueue → Tools / Scaffolds / Validators → Memory
```

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Build
npm run build
```

## License

MIT

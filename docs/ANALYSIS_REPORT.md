# Agent Harness 项目分析报告

## 1. 项目概述

**项目名称**: @bowlofnoodles/agent-harness
**版本**: 1.0.0
**描述**: 基于 harness-engineering 架构的全栈项目脚手架生成工具，专为 AI 编码助手（Claude Code、GitHub Copilot）设计的持续自主开发框架。

**GitHub**: https://github.com/bowlofnoodles/agent-harness

---

## 2. 技术栈分析

### 核心框架

| 层级 | 技术 |
|------|------|
| **运行时** | Node.js >=18.0.0, TypeScript 5.9 |
| **CLI 框架** | Commander 12.1.0 |
| **代码生成** | fs-extra, glob |
| **用户交互** | Inquirer 9.3.8, Chalk 5.6.2, Ora 8.2.0 |
| **验证** | Zod 3.25.76, ESLint |
| **日志** | Winston 3.19.0 |
| **事件** | EventEmitter3 5.0.4 |
| **测试** | Vitest 1.6.1 |

### 生成项目模板

| 模板 | 技术栈 |
|------|--------|
| **React 前端** | React 18, TypeScript, Vite, Tailwind CSS, React Router 6, Zustand/Redux |
| **NestJS 后端** | Nest.js 10, TypeScript, Prisma, PostgreSQL/SQLite, JWT Auth, Swagger, Docker |

---

## 3. 架构设计

### 3.1 核心引擎 (Agent Core)

```
Agent (EventEmitter)
├── TaskQueue       # 任务队列管理
├── Memory          # 持久化知识存储
├── ToolRegistry    # 工具注册中心
├── ScaffoldRegistry # 脚手架注册中心
└── ValidationPipeline # 验证流水线
```

### 3.2 核心组件

#### Agent (src/core/agent.ts)
- **职责**: 中央协调器，实现 Agent Loop 模式
- **流程**: 接收任务 → 从 Memory 检索上下文 → 使用工具执行 → 验证结果 → 存储学到内容 → 报告结果
- **特性**: 基于 EventEmitter3 的事件驱动架构

#### TaskQueue (src/core/task-queue.ts)
- **优先级**: critical > high > normal > low
- **依赖解析**: 支持任务间依赖关系
- **重试机制**: 可配置最大重试次数
- **并发控制**: 可配置最大并发任务数
- **状态追踪**: pending → running → completed/failed

#### Memory (src/core/memory.ts)
- **持久化**: JSON 文件存储
- **搜索**: 支持按主题、关键词、标签搜索
- **用途**: 跨会话存储事实、约定和模式

### 3.3 工具系统 (Tool System)

**基类**: BaseTool (抽象接口)

**内置工具**:
| 工具 | 职责 |
|------|------|
| FileSystemTool | 文件读写、复制、删除 |
| ShellTool | 执行 Shell 命令（带超时） |
| GitTool | Git 操作（init, commit, branch） |

**扩展机制**: 支持运行时注册自定义工具

### 3.4 脚手架系统 (Scaffold System)

**基类**: BaseScaffold

**内置模板**:

1. **ReactScaffold** (src/scaffolds/react-app.ts)
   - 选项: Tailwind CSS, React Router, 状态管理 (Zustand/Redux)
   - 生成: 约 15 个文件，包括完整的 React 18 + Vite 项目结构

2. **NestjsScaffold** (src/scaffolds/nestjs-api.ts)
   - 选项: 数据库 (PostgreSQL/SQLite), JWT 认证, Swagger 文档, Docker
   - 生成: 约 30 个文件，包括完整的 NestJS 模块化架构

**AI 集成**: 每个生成的项目包含:
- `CLAUDE.md` - Claude Code 指令
- `.github/copilot-instructions.md` - GitHub Copilot 指令

### 3.5 验证流水线 (Validation Pipeline)

**验证器**:
- **LintValidator**: ESLint 检查
- **TestValidator**: 测试套件运行
- **SecurityValidator**: npm audit 漏洞扫描

**配置**: 通过 `.harness.yaml` 控制开关

---

## 4. CLI 命令接口

| 命令 | 功能 |
|------|------|
| `agent-harness init` | 初始化 Harness 配置 |
| `agent-harness scaffold` | 生成项目脚手架 |
| `agent-harness guide` | 显示 AI Agent 工作流指南 |
| `agent-harness status` | 显示 Agent 状态 |
| `agent-harness run` | 启动 Agent 循环 |

---

## 5. 目录结构

```
agent-harness/
├── src/
│   ├── index.ts              # CLI 入口
│   ├── types.ts              # 核心类型定义
│   ├── cli/                  # CLI 命令处理器
│   │   ├── init.ts
│   │   ├── scaffold.ts
│   │   ├── guide.ts
│   │   ├── status.ts
│   │   ├── run.ts
│   │   └── inject.ts
│   ├── core/                 # Harness 引擎核心
│   │   ├── agent.ts          # Agent 协调器
│   │   ├── task-queue.ts     # 任务队列
│   │   └── memory.ts         # 知识存储
│   ├── tools/                # 工具系统
│   │   ├── base-tool.ts
│   │   ├── file-system.ts
│   │   ├── shell.ts
│   │   ├── git.ts
│   │   └── index.ts
│   ├── scaffolds/            # 项目生成器
│   │   ├── base-scaffold.ts
│   │   ├── react-app.ts
│   │   ├── nestjs-api.ts
│   │   └── index.ts
│   ├── validation/           # 验证流水线
│   ├── config/              # 配置管理
│   └── utils/               # 工具函数
│       ├── logger.ts
│       └── errors.ts
├── tests/                   # 单元测试 (Vitest)
├── docs/                    # 文档
└── package.json
```

---

## 6. 配置系统

**配置文件**: `.harness.yaml`

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

**验证**: 使用 Zod schema validation

---

## 7. 设计原则

1. **AI-Native**: 每个生成的项目预置 AI Agent 指令文件
2. **可扩展**: 工具、脚手架、验证器均支持插件化注册
3. **类型安全**: 全程 TypeScript + Zod schema 验证
4. **持久化**: Memory 跨会话存活，实现持续改进
5. **可观测**: 基于 EventEmitter3 的事件驱动架构
6. **生产就绪**: 生成的项目包含安全、验证、Docker、Swagger
7. **可测试**: 核心组件均有单元测试

---

## 8. 优缺点分析

### 优点

- **完整的全栈生成方案**: React + NestJS 一次性生成前后端项目
- **AI 优先**: 专为 AI 编码助手设计，减少 AI 理解项目的时间
- **模块化设计**: 各组件职责清晰，易于扩展
- **事件驱动**: 良好的可观测性和日志记录
- **配置驱动**: 通过 YAML 和 Zod 实现类型安全的配置

### 缺点

- **NestJS Scaffold 硬编码**: AuthService 中有明显的 TODO 和占位符代码
- **测试覆盖**: 仅 4 个测试文件，覆盖范围有限
- **文档缺失**: 缺少 API 文档和使用示例
- **Inject 命令**: 存在 `inject.ts` 但功能未知

---

## 9. 代码质量评估

| 指标 | 评分 | 说明 |
|------|------|------|
| **类型安全** | ⭐⭐⭐⭐⭐ | 全程 TypeScript + Zod |
| **测试覆盖** | ⭐⭐ | 仅 4 个测试文件 |
| **错误处理** | ⭐⭐⭐⭐ | 统一的 TaskError 类和 HttpExceptionFilter |
| **代码组织** | ⭐⭐⭐⭐⭐ | 清晰的模块划分 |
| **可维护性** | ⭐⭐⭐⭐ | 良好的抽象和接口设计 |
| **文档** | ⭐⭐⭐ | README 和架构文档完整，但缺少 API 文档 |

---

## 10. 建议改进

1. **完善测试**: 增加核心组件（Agent, TaskQueue, Memory）的单元测试
2. **清理占位代码**: NestjsScaffold 的 AuthService 有 TODO 需要实现
3. **增加更多 Scaffold**: 如 Next.js, Express, Go 等
4. **完善错误处理**: 统一的错误类型和恢复策略
5. **性能优化**: 考虑大规模项目的生成性能
6. **插件系统**: 更灵活的插件加载机制

---

## 11. 总结

Agent Harness 是一个设计良好的 AI 辅助开发框架，通过预置 AI 指令文件的方式，显著提升了 AI 编码助手理解和使用项目的效率。其核心引擎采用成熟的事件驱动架构，模块化程度高，易于扩展。主要价值在于生成"AI 就绪"（AI-Ready）的项目结构，让 Claude Code 和 GitHub Copilot 能够快速上手并持续开发。

**适合场景**:
- 团队使用 AI 编码助手进行开发
- 需要快速初始化全栈项目
- 希望统一项目结构和代码规范

**不太适合**:
- 需要深度定制化的脚手架
- 非 TypeScript 项目
- 简单的单页面应用

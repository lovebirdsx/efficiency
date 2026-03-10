# Efficiency 扩展 - Copilot 开发指南

## 项目概览

**Efficiency** 是一个旨在提升开发者效率的 Visual Studio Code 扩展。它提供了一系列实用工具，包括中英文标点符号转换、Markdown 表格生成、多文件合并（用于为 AI 提供上下文），以及集成的高级外部 Shell 命令执行和路径格式自动转换功能。

### 核心技术栈
- **TypeScript**: 主要开发语言（遵循 ES2022 目标）。
- **Node.js**: 扩展宿主运行环境。
- **VS Code Extension API**: 用于命令注册、事件监听和 UI 交互。
- **Webpack**: 用于生产环境的打包与编译 (`yarn compile` / `yarn package`)。
- **Mocha / VS Code Test CLI**: 用于自动化测试 (`yarn test`)。

---

## 项目架构与目录结构

代码库结构相对扁平，按照功能职责划分：

### 根目录关键文件
- `package.json`：扩展的清单文件，定义了所有的贡献点（`contributes`）、设置（`configuration`）、命令（`commands`）和快捷键。
- `webpack.config.js`：打包配置，生成文件到 `dist/`。
- `tsconfig.json`：TypeScript 编译配置（严格模式 `strict: true`）。

### 核心源码 (`src/`)
- **`src/extension.ts`**：扩展的入口点。负责在 `activate` 生命周期中注册所有的命令（Commands）和事件监听器（Listeners），并管理它们的生命周期（Disposables）。
- **`src/commands.ts`**：所有命令的核心业务逻辑实现。包括 Shell 执行、标点转换调度、Markdown 触发、以及配置文件的生成和文件合并逻辑。
- **`src/listenners.ts`**：VS Code 事件监听器。目前包含 `changePathSeparator`，用于在粘贴时自动转换 Windows 路径分隔符。
- **`src/log.ts`**：自定义日志系统，封装了 `vscode.LogOutputChannel`。**注意：开发时必须使用此模块而不是 `console.log`。**

### 工具模块 (`src/common/`)
- **`fileMerger.ts`**：强大的文件合并工具，支持目录递归、忽略规则（`.gitignore` 及自定义规则）、隐藏文件过滤和代码块包裹。
- **`markdown.ts`**：处理 Markdown 相关的工具函数（如生成表格）。
- **`punctuationConverter.ts`**：实现中英文标点符号的双向转换算法。

### 测试 (`src/test/`)
- 包含了针对 `fileMerger` 和 `punctuationConverter` 的单元与集成测试。基于 Mocha 框架。

---

## 变更与验证流程

在运行任何测试或声明工作完成之前，**必须**遵循以下步骤：

1. **编译检查**：在进行代码更改后，运行 `yarn compile` 确保 Webpack 能够无错误地打包，或者保持 `yarn watch` 任务在后台运行以进行实时编译。
2. **测试编译**：由于测试框架依赖 `out/` 目录，运行测试前确保执行过 `yarn compile-tests` 或在后台运行 `yarn watch-tests`。
3. **运行测试**：使用 `yarn test` 运行完整的测试套件。确保没有破坏现有的文本合并或标点转换逻辑。
4. **版本与日志同步**：对于功能变更或缺陷修复，必须同步更新 `package.json` 中的 `version` 与 `CHANGELOG.md` 的对应条目（建议使用补丁版本号递增）。

---

## 编码规范与最佳实践

### 命名与格式
- **类型/接口/枚举**：使用 `PascalCase`（例如 `IMergeFileOptions`、`PunctuationConverter`）。
- **函数/变量/属性**：使用 `camelCase`（例如 `concatTextFiles`、`currentWorkspace`）。
- **常量**：避免向全局命名空间泄漏变量。优先使用文件作用域的静态类或 `const` 字典。

### VS Code API 使用规范
- **资源清理**：所有通过 `vscode.commands.registerCommand`、`vscode.window.createOutputChannel` 或 `vscode.workspace.onDidChangeTextDocument` 创建的资源，**必须**被推入 `context.subscriptions` 数组中以防止内存泄漏。
- **配置读取**：读取设置时，始终使用强类型：`vscode.workspace.getConfiguration('efficiency').get<Type>('key')`。
- **路径与 URI**：处理文件路径时，注意跨平台兼容性（Windows 的 `\` 与 Unix 的 `/`）。优先使用 `path` 模块进行路径拼接和解析。

### 日志与错误处理
- **禁止使用 Console**：永远不要使用原生的 `console.log`、`console.warn` 或 `console.error`。
- **使用 Log 模块**：引入 `src/log.ts`，使用 `info()`, `warn()`, `error()` 记录日志。它们会自动输出到 VS Code 的 Output 面板中（频道名称为 "Efficiency"）。
- **用户提示**：对于需要用户知晓的成功/失败信息，结合使用 `vscode.window.showInformationMessage` 或 `vscode.window.showErrorMessage`。

### 代码质量与安全性
- **严格类型**：避免使用 `any` 或 `unknown`。必须定义明确的接口（例如 `IMergeFileOptions`）。
- **异步操作**：优先使用 `async`/`await` 进行文件系统操作（使用 `fs.promises` 而不是同步的 `fs.readFileSync`，除非在无法异步的特定小范围内）。在命令执行函数中要确保妥善 catch 并处理异步错误。
- **子进程管理**：使用 `child_process.spawn` 执行 Shell 命令时，必须妥善处理 `stdout`、`stderr`、`error` 和 `exit` 事件，避免僵尸进程。如果不需要等待结果（如打开外部终端），应使用 `.unref()` 使其分离。

### 编辑/新增功能的入口点提示
- **新增命令**：
  1. 在 `package.json` 的 `contributes.commands` 中声明。
  2. 在 `src/commands.ts` 中实现逻辑并 export。
  3. 在 `src/extension.ts` 的 `activate` 函数中使用 `registerCommand` 注册。
- **新增设置项**：
  1. 在 `package.json` 的 `contributes.configuration` 中声明。
  2. 在代码中通过 `vscode.workspace.getConfiguration('efficiency').get(...)` 获取，并考虑到默认值的 fallback。
- **修改合并逻辑**：聚焦于 `src/common/fileMerger.ts`。修改后必须完善/更新 `src/test/fileMerger.test.ts` 和 `getFilesToConcat.test.ts`。

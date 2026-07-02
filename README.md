# FAUI SDK

FAUI SDK 是一个基于 TypeScript、React 和 Ant Design 的 JSON Schema UI 渲染 SDK。

项目目标是通过结构化 JSON 配置描述界面、数据和交互，让业务方可以用统一协议构建动态表单和动态页面。

## 目录结构

- `src/`：SDK 源码和导出入口。
- `examples/`：本地示例应用入口。
- `tests/`：后续自动化测试目录。
- `docs/`：设计说明或 API 文档。
- `scripts/`：后续工程脚本目录。

## 基础命令

- `npm run dev`：启动示例应用。
- `npm run typecheck`：执行 TypeScript 类型检查。
- `npm run build`：通过 `tsup` 生成 CJS、ESM 和类型声明。
- `npm run lint`：通过 ESLint 检查 `src/` 和 `examples/`。
- `npm test`：命令名已保留，测试框架后续接入。

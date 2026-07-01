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
- `npm run build`：当前等同于类型检查，后续工具链任务会接入正式构建。
- `npm run lint`：命令名已保留，ESLint 后续接入。
- `npm test`：命令名已保留，测试框架后续接入。

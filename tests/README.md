# 单元测试

测试按源码模块组织：

- `actions/`：Action 执行、成功/失败链和消息反馈
- `components/`：组件注册表、公共渲染契约和关键交互
- `context/`：Renderer 与 Form 上下文
- `hooks/`：Renderer Hooks
- `lifecycle/`：Activity Snapshot 与 Delta
- `store/`：数据 Store、路径订阅和 Hook 集成
- `utils/`：表达式、路径、动画和样式工具

验证命令：

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
```

覆盖率最低要求：语句、函数和行 85%，分支 80%。

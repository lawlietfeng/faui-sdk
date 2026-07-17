# Contributing to FAUI

感谢你对 FAUI 的关注！欢迎提交 Issue 和 Pull Request。

## 开发环境

```bash
# 克隆仓库
git clone https://github.com/lawlietfeng/faui-sdk.git
cd faui-sdk

# 安装依赖
npm install

# 启动开发服务器（含示例页面）
npm run dev

# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 构建
npm run build
```

## 项目结构

```
src/
├── components/       # 组件实现
├── types/            # TypeScript 类型定义
│   └── components/   # 各组件的类型
├── hooks/            # 自定义 Hooks
├── actions/          # Action 系统（update_data, http_proxy 等）
├── context/          # React Context（Renderer, Form）
├── utils/            # 工具函数（表达式引擎等）
├── index.tsx         # 表单版入口
└── full.tsx          # 完整版入口
docs/                 # 组件文档
examples/             # 示例 JSON Schema
```

## 提交 Pull Request

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/my-feature`
3. 确保通过检查：`npm run typecheck && npm run lint`
4. 提交代码，commit message 遵循 [Conventional Commits](https://www.conventionalcommits.org/)：
   - `feat: 新功能`
   - `fix: 修复 bug`
   - `docs: 文档更新`
   - `refactor: 重构`
5. 推送并创建 PR

## 代码规范

- TypeScript strict 模式
- 组件默认样式使用 `@layer faui` CSS 类，不内联布局样式
- 组件 prop 中可能包含 `${expr}` 的字段必须经过 `useExpression()` 处理
- 使用 Ant Design v5+ 最新 API（`destroyOnHidden` 而非 `destroyInactiveTabPane`）
- 新组件需要在 `src/types/components/` 下添加类型定义，并注册到对应的 registry

## 提交 Issue

- Bug 报告请附上最小可复现的 JSON Schema
- 功能建议请说明使用场景

## 许可证

本项目采用 [MIT](./LICENSE) 许可证。提交 PR 即表示你同意将贡献代码以相同许可证发布。

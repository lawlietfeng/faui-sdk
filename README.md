# faui

FAUI (Fantasy Agent UI) — JSON Schema renderer based on Ant Design.

**核心亮点**：67+ 组件 · 双版本按需引入 · 响应式栅格（xs/sm/md/lg/xl/xxl 自适应） · **framer-motion 动画系统**（6 预设 + Spring 物理 + 自定义动画，渐进增强） · ECharts 数据可视化 · 表达式引擎安全沙箱 · 组件级 Error Boundary 容错 · JSON Patch 增量更新

FAUI 提供两个版本，按需引入：

| 版本 | 导入路径 | 组件数 | 适用场景 |
|------|---------|--------|---------|
| **表单版** (Form Edition) | `import { Renderer } from '@lawlietfeng/faui-sdk'` | ~47 | AI 表单生成、数据采集 |
| **完整版** (Full Edition) | `import { Renderer } from '@lawlietfeng/faui-sdk/full'` | 66+ | 全功能页面渲染 |

## 安装

```bash
npm install @lawlietfeng/faui-sdk
```

## Peer Dependencies

```bash
npm install react react-dom antd dayjs
```

如需使用 `chart` 组件（完整版），还需安装 ECharts（可选）：

```bash
npm install echarts
```

如需使用 `animation` 动画系统，还需安装 framer-motion（可选）：

```bash
npm install framer-motion
```

## 使用教程

### 1. 准备项目

安装依赖并启动本地开发环境：

```bash
npm install
npm run dev
```

如果你是在其他 React 项目中使用本库，只需安装 `faui` 与 Peer Dependencies。

### 2. 最小可运行示例

FAUI 提供了两种渲染器（`SchemaRenderer` 纯 UI 渲染 和 `Renderer` 生命周期渲染），并且每种渲染器都有表单版和完整版两个入口。

#### 方式一：纯 UI 渲染器 `SchemaRenderer` (推荐)
如果你在业务代码中自己管理状态流，只需将纯粹的 UI 描述（`components` 和 `dataModel`）传递给 `SchemaRenderer`。

> 注意：`SchemaRenderer` 是底层渲染器，需要显式传入 `componentRegistry`。如果你使用 `Renderer` 包装器则无需手动传入。

```tsx
import React from 'react';
import { SchemaRenderer, ComponentRegistry } from '@lawlietfeng/faui-sdk';       // 表单版组件
// import { SchemaRenderer, ComponentRegistry } from '@lawlietfeng/faui-sdk/full'; // 完整版组件
import type { Content } from '@lawlietfeng/faui-sdk';

const schema: Content = {
  components: [
    { id: 'root', component: 'box', children: ['title'] },
    { id: 'title', component: 'text', content: 'Hello FAUI!' }
  ],
  dataModel: {},
};

export default function App() {
  return <SchemaRenderer schema={schema} componentRegistry={ComponentRegistry} />;
}
```

#### 方式二：带生命周期的渲染器 `Renderer` (向下兼容)
如果你有一个包含多种状态的流（例如 AI Agent 的回复流），你可以直接使用 `Renderer`。它会自动从数组中拦截并提取 `type: 'ACTIVITY_SNAPSHOT'` 的状态进行渲染，并支持后续通过 `type: 'ACTIVITY_DELTA'` 对 UI 或数据进行高性能的局部增量更新。

`Renderer` 已内置默认组件注册表（表单版或完整版，取决于导入路径），无需手动传入 `componentRegistry`。

> 关于 `ACTIVITY_DELTA` 及 JSON Patch 增量更新的详细小白指南，请参阅 [生命周期类型与增量更新 (docs/lifecycle-types.md)](./docs/lifecycle-types.md)。

```tsx
import React from 'react';
import { Renderer } from '@lawlietfeng/faui-sdk';       // 表单版（默认 ~47 组件）
// import { Renderer } from '@lawlietfeng/faui-sdk/full'; // 完整版（全部 66+ 组件）
import type { Activity } from '@lawlietfeng/faui-sdk';

const schema: Activity[] = [
  {
    type: 'ACTIVITY_SNAPSHOT',
    content: {
      components: [
        {
          id: 'root',
          component: 'box',
          children: ['title'],
        },
        {
          id: 'title',
          component: 'text',
          content: 'Hello FAUI!',
        }
      ],
      dataModel: {},
    },
  },
  {
    type: 'ACTIVITY_DELTA',
    patch: [
      { op: 'replace', path: '/dataModel/username', value: 'FAUI V2' }
    ]
  }
];

export default function App() {
  return <Renderer schema={schema} />;
}
```

### 3. Schema 编写核心规则

1. `content.components` 是组件配置数组，通过 `id` 唯一标识。
2. 父子关系由 `children: string[]` 关联子组件 `id`。
3. 数据绑定通过 `{ path: '/xxx' }` 读取数据模型。
4. 事件触发通过 `on_change`、`on_tap` 等字段绑定 action。
5. 条件展示使用 `visible`（支持表达式求值）。

### 3.1 Form 组件与 Rules 校验

Form 属于相对复杂场景（容器、字段规则、触发时机、提交流程），详细文档已拆分到：

- [docs/form-guide.md](./docs/form-guide.md)
- [docs/external-submit.md](./docs/external-submit.md) — 宿主页面通过 ref 校验和提交

建议优先阅读该文档，再结合 `examples/schemas/form-rules-demo.json` 快速上手。

### 3.2 npm 包开箱即用指南

- [docs/npm-usage.md](./docs/npm-usage.md)

### 3.3 Action 配置指南

- [docs/actions/README.md](./docs/actions/README.md)

### 3.4 Animation 动画系统

- [docs/animation.md](./docs/animation.md) — 6 种预设 + Spring 物理 + 自定义动画，可选安装 framer-motion 即可启用

### 4. Action 执行机制

内置支持四类 action：

- `update_data`：更新数据模型字段。
- `http_proxy`：调用外部 `httpRequest` 发起请求。
- `message`：全局轻提示。
- `notification`：全局通知提示。

此外，`ActionType` 中还声明了以下扩展动作（默认无内置执行器）：

- `copy`
- `mcp_tool_call`
- `send_prompt`
- `input_prompt`

你可以通过 `Renderer` 的 `onAction` 监听所有 action 执行上下文，用于埋点、调试或权限控制。
完整属性与示例请参考 [docs/actions/README.md](./docs/actions/README.md)。

扩展动作接管演示（可直接运行）：
- 汇总 Schema：`examples/schemas/action-all-demo.json`
- 宿主执行器：`examples/App.tsx`（通过扩展 `ActionRegistry` 接管 `copy`、`mcp_tool_call`、`send_prompt`、`input_prompt`）

### 4.1 on_mount — 组件挂载生命周期

任何组件都可以配置 `on_mount`，在组件首次挂载时自动执行 action。适用于页面加载时请求数据、初始化状态等场景。

```json
{
  "id": "root",
  "component": "box",
  "on_mount": [
    { "action": "update_data", "path": "/loading", "value": true },
    { "action": "http_proxy", "payload": { "http_config": { "method": "GET", "path": "/api/data" } } }
  ],
  "children": ["content"]
}
```

- `on_mount` 支持单个 `ActionConfig` 或数组 `ActionConfig[]`
- 组件挂载后按顺序 await 执行
- 所有组件类型均支持，无需单独适配

### 4.2 on_success / on_error — Action 链式回调

任何 action 都可以配置 `on_success` 和 `on_error`，实现异步链式调用。前一个 action 的返回值通过 `$result` 传递，错误信息通过 `$error` 传递。

```json
{
  "action": "http_proxy",
  "payload": { "http_config": { "method": "POST", "path": "/api/save" } },
  "on_success": [
    { "action": "update_data", "path": "/data", "value": "${$result.data}" },
    { "action": "message", "payload": { "type": "success", "content": "保存成功" } }
  ],
  "on_error": [
    { "action": "notification", "payload": { "type": "error", "message": "保存失败：${$error}" } }
  ]
}
```

- `on_success` / `on_error` 支持单个 `ActionConfig` 或数组 `ActionConfig[]`
- `$result`：前一个 action handler 的返回值（`http_proxy` 返回 HTTP 响应体）
- `$error`：捕获到的错误消息字符串
- 链式支持递归嵌套 —— on_success 里的 action 也可以有自己的 on_success/on_error
- 完整演示：`examples/schemas/14-on-mount-demo.json`

### 4.3 condition — 条件渲染组件

根据表达式结果选择渲染不同的子组件分支。支持两种模式：

**布尔 if/else：**
```json
{
  "id": "auth-gate",
  "component": "condition",
  "when": "${$root.isLoggedIn}",
  "then": ["dashboard"],
  "else": ["login-form"]
}
```

**多值 switch/case：**
```json
{
  "id": "status-view",
  "component": "condition",
  "match": "${$root.pageStatus}",
  "cases": {
    "loading": ["spinner"],
    "success": ["data-view"],
    "error": ["error-view"]
  },
  "default": ["fallback"]
}
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `when` | `string \| boolean \| ValueBinding` | 布尔模式的条件表达式 |
| `then` | `string[]` | 条件为 truthy 时渲染的子组件 ID |
| `else` | `string[]` | 条件为 falsy 时渲染的子组件 ID |
| `match` | `string \| ValueBinding` | switch 模式的匹配表达式 |
| `cases` | `Record<string, string[]>` | 匹配值 → 子组件 ID 映射 |
| `default` | `string[]` | 无匹配时的后备子组件 ID |

### 4.4 repeater — 通用数据遍历组件

对数据数组的每一项重复渲染模板子组件，每次迭代自动获得作用域（`$current` = 当前项，`$parent` = 完整数组，相对路径 `./field` 解析到当前项）。

```json
{
  "id": "user-cards",
  "component": "repeater",
  "data": { "path": "/users" },
  "children": ["user-card-template"],
  "direction": "horizontal",
  "gap": 16
}
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `data` | `ValueBinding` | 数据源路径，值应为数组 |
| `children` | `string[]` | 模板子组件 ID，每项重复渲染 |
| `direction` | `'vertical' \| 'horizontal'` | 排列方向（默认 vertical） |
| `gap` | `number` | 项间距（px） |
| `emptyContent` | `string` | 空数据时的提示文本 |

- 完整演示：`examples/schemas/15-condition-repeater-demo.json`

### 5. 核心开发规范与防呆指南

如果你计划参与 FAUI 的组件开发或进行二次扩展，请务必阅读以下核心规范，避免踩坑：

- **动态表达式 (useExpression)**：凡是“文本”或“配置”属性（如 `title`, `label`, `options`），必须使用 `useExpression()` 包装后才能渲染，否则 `${xxx}` 语法将失效。
- **$root 作用域**：在 JSON 中编写表达式时，访问全局 `dataModel` 必须带上 `$root.` 前缀（如 `${$root.user.name}`）。
- **双向绑定回写**：表单组件的 `onChange` 事件中，如果没有自定义的 `on_change` action，但配置了 `value.path`，必须提供默认的 `update_data` 回写逻辑。
- **单/多选状态隔离**：对于 `Checkbox` 等既能单选又能多组选的组件，状态必须兼容 `boolean` 和 `array`，传给多选组时需做 `Array.isArray` 保护。
- **废弃 API 警告**：严格遵守 Ant Design 5.x 的最新 API，例如使用 `destroyOnHidden` 代替 `destroyInactiveTabPane`，使用 `variant` 代替 `bordered`。
- **React 节点保护 (栈溢出防范)**：底层表达式引擎 (`useExpression`) 现已支持混合包含 ReactNode 的对象。直接遍历 React 对象由于其内部的循环引用 (`_owner`) 曾导致 `Maximum call stack size exceeded` 错误，现通过 `isValidElement` 安全跳过。
- **数组配置表达式包裹**：若组件属性为数组配置（如 Tabs 的 `items` 数组，或 Select 的 `options` 数组），必须将该数组整体传入 `useExpression()` 后再进行渲染映射，以防内部子项表达式失效。
- **组件注册别名与名称一致**：JSON 中 `"component"` 的值必须与 `src/components/index.ts` 注册表严格一致。为避免布局报错（如把 `Row` 误写成 `grid`），渲染器底层已对易混淆容器添加了容错别名映射。
- **DOM 节点定位 (Anchor/Affix)**：编写可被锚点或固钉追踪定位的组件配置时，严禁使用内部组件 `id`，必须显式配置 `domId`。且切勿将 `domId` 设置在 `Typography` 或文本元素上（会导致滚动失效），必须设置在包裹该文字的块级容器组件（如 `Box`, `Flex`, `Layout`）上。

> 💡 更详细的架构设计与开发者排错指南，请参阅 [开发指南 (docs/development.md)](./docs/development.md)。

### 6. 本地调试建议

仓库下 `examples/schemas` 提供了多份可直接替换的业务 JSON（如请假、报销、用章等），建议调试流程：

1. 先用最小示例跑通渲染链路。
2. 再替换为 `examples/schemas/*.json` 观察复杂场景表现。
3. 需要扩展渲染能力时，使用 `customComponents` 或组件注册机制。

## 支持的组件

### 布局与导航

| 组件 | 说明 |
|------|------|
| `flex` | 弹性布局容器 |
| `grid` (row/col) | 栅格布局（支持 xs/sm/md/lg/xl/xxl 响应式断点） |
| `space` | 间距容器 |
| `layout` | 整体布局 (Header/Sider/Content/Footer) |
| `form` | 表单容器，负责字段校验与提交管理 |
| `box` | 基础布局容器 (兼容旧版) |
| `menu` | 导航菜单 |
| `tabs` | 标签页 |
| `steps` | 步骤条 |
| `pagination` | 分页 |
| `anchor` | 锚点 |
| `dropdown` | 下拉菜单 |
| `affix` | 固钉 |
| `float_button` | 悬浮按钮 |

### 数据展示

| 组件 | 说明 |
|------|------|
| `typography` | 排版组件 (标题/段落/链接/文本) |
| `text` | 基础文本展示 (兼容旧版) |
| `icon` | 图标组件 |
| `button` | 按钮，触发 on_tap 动作 |
| `list` | 列表渲染，遍历数组数据 |
| `table` | 表格渲染，支持列定义与分页 |
| `tree` | 树形控件 |
| `carousel` | 走马灯 |
| `calendar` | 日历 |
| `segmented` | 分段控制器 |
| `avatar` | 头像展示 |
| `badge` | 徽标数提示 |
| `empty` | 空状态占位 |
| `statistic` | 统计数值与倒计时 |
| `timeline` | 时间轴 |
| `qrcode` | 二维码生成 |
| `watermark` | 页面水印 |
| `skeleton` | 骨架屏占位 |
| `card` | 卡片容器，用于分组展示内容 |
| `divider` | 分割线，分隔内容 |
| `collapse` | 可折叠面板，内容分组展示 |
| `tag` | 标签，用于标记和分类 |
| `image` | 图片展示 |
| `descriptions` | 描述列表，展示键值对 |
| `stepindicator` | 步骤指示器 |

### 表单与数据录入

| 组件 | 说明 |
|------|------|
| `input` | 单行文本输入框 |
| `textarea` | 多行文本输入框 |
| `select` | 下拉选择框 |
| `radio` | 单选按钮组 |
| `checkbox` | 复选框 |
| `datepicker` | 日期选择器 |
| `timepicker` | 时间选择器 |
| `upload` | 文件上传 |
| `switch` | 开关组件 |
| `inputnumber` | 数字输入框 |
| `slider` | 滑动输入条 |
| `rate` | 星级评分 |
| `cascader` | 级联选择（省市区等） |
| `treeselect` | 树形选择 |
| `transfer` | 穿梭框（双向列表） |
| `autocomplete` | 自动完成（输入建议） |
| `colorpicker` | 颜色选择器 |
| `mentions` | 提及组件（@用户） |

### 弹层与反馈

| 组件 | 说明 |
|------|------|
| `modal` | 对话框 |
| `drawer` | 抽屉 |
| `popover` | 气泡卡片 |
| `tooltip` | 文字提示 |
| `popconfirm` | 气泡确认框 |
| `tour` | 漫游导览 |
| `alert` | 警告提示，展示重要信息 |
| `progress` | 进度条，展示进度 |
| `spin` | 加载中状态 |

### 逻辑与控制流

| 组件 | 说明 |
|------|------|
| `condition` | 条件渲染，支持 if/else 和 switch/case 两种模式 |
| `repeater` | 数据遍历，对数组每项重复渲染模板子组件 |

### 数据可视化

| 组件 | 说明 |
|------|------|
| `chart` | ECharts 图表，支持 line/bar/pie/scatter/area/radar/gauge/funnel/heatmap 及原生 option |

### 组件文档（高级用法）

你可以通过访问 `docs/components/` 目录查看各个组件的详细配置结构与数据绑定规范。

- [affix](./docs/components/affix.md)
- [alert](./docs/components/Alert.md)
- [anchor](./docs/components/anchor.md)
- [autocomplete](./docs/components/autocomplete.md)
- [avatar](./docs/components/avatar.md)
- [badge](./docs/components/badge.md)
- [box](./docs/components/box.md)
- [button](./docs/components/button.md)
- [calendar](./docs/components/calendar.md)
- [card](./docs/components/Card.md)
- [carousel](./docs/components/carousel.md)
- [cascader](./docs/components/cascader.md)
- [chart](./docs/components/chart.md)
- [checkbox](./docs/components/checkbox.md)
- [collapse](./docs/components/Collapse.md)
- [colorpicker](./docs/components/colorpicker.md)
- [condition](./docs/components/condition.md)
- [datepicker](./docs/components/datepicker.md)
- [descriptions](./docs/components/Descriptions.md)
- [divider](./docs/components/Divider.md)
- [drawer](./docs/components/drawer.md)
- [dropdown](./docs/components/dropdown.md)
- [empty](./docs/components/empty.md)
- [flex](./docs/components/flex.md)
- [floatButton](./docs/components/floatButton.md)
- [form](./docs/components/form.md)
- [grid](./docs/components/grid.md)
- [icon](./docs/components/Icon.md)
- [image](./docs/components/Image.md)
- [input](./docs/components/input.md)
- [inputnumber](./docs/components/inputnumber.md)
- [layout](./docs/components/layout.md)
- [list](./docs/components/list.md)
- [mentions](./docs/components/mentions.md)
- [menu](./docs/components/menu.md)
- [modal](./docs/components/modal.md)
- [pagination](./docs/components/pagination.md)
- [popconfirm](./docs/components/popconfirm.md)
- [popover](./docs/components/popover.md)
- [progress](./docs/components/Progress.md)
- [qrcode](./docs/components/QRCode.md)
- [radio](./docs/components/radio.md)
- [rate](./docs/components/rate.md)
- [repeater](./docs/components/repeater.md)
- [segmented](./docs/components/segmented.md)
- [select](./docs/components/select.md)
- [skeleton](./docs/components/Skeleton.md)
- [slider](./docs/components/slider.md)
- [space](./docs/components/space.md)
- [spin](./docs/components/Spin.md)
- [statistic](./docs/components/Statistic.md)
- [stepindicator](./docs/components/stepindicator.md)
- [steps](./docs/components/steps.md)
- [switch](./docs/components/switch.md)
- [table](./docs/components/table.md)
- [tabs](./docs/components/tabs.md)
- [tag](./docs/components/Tag.md)
- [text](./docs/components/text.md)
- [textarea](./docs/components/textarea.md)
- [timeline](./docs/components/Timeline.md)
- [timepicker](./docs/components/timepicker.md)
- [tooltip](./docs/components/tooltip.md)
- [tour](./docs/components/tour.md)
- [transfer](./docs/components/transfer.md)
- [tree](./docs/components/tree.md)
- [treeselect](./docs/components/treeselect.md)
- [typography](./docs/components/Typography.md)
- [upload](./docs/components/upload.md)
- [watermark](./docs/components/Watermark.md)

## 表格组件搭建细节

`table` 组件通过 `data.path` 读取数组数据源，通过 `columns` 定义列结构。基础配置如下：

```json
{
  "id": "salary-table",
  "component": "table",
  "data": { "path": "/employees" },
  "rowKey": "id",
  "bordered": true,
  "tableSize": "middle",
  "pagination": { "pageSize": 5 },
  "emptyText": "暂无数据",
  "columns": [
    { "title": "姓名", "dataIndex": "name" },
    { "title": "部门", "dataIndex": "department" },
    { "title": "已入职", "dataIndex": "onboarded", "renderAs": "checkbox" },
    {
      "title": "状态",
      "dataIndex": "status",
      "renderAs": "tag",
      "statusColors": {
        "在职": "green",
        "试用": "gold",
        "离职": "red"
      }
    },
    {
      "title": "月薪",
      "dataIndex": "salary",
      "template": "¥${$current.salary} / 月"
    }
  ]
}
```

可用字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.path` | `string` | 表格数据源路径，值应为数组 |
| `columns` | `TableColumn[]` | 列定义，至少包含 `title`、`dataIndex` |
| `columns[].template` | `string` | 表达式模板，支持 `$root`、`$current`、`$parent` |
| `columns[].renderAs` | `'text' \| 'checkbox' \| 'tag'` | 单元格渲染类型 |
| `columns[].statusColors` | `Record<string, string>` | `tag` 渲染时的状态色映射 |
| `rowKey` | `string` | 行唯一键，默认 `id` |
| `pagination` | `boolean \| { pageSize?: number }` | 分页配置，`false` 关闭 |
| `bordered` | `boolean` | 是否显示边框 |
| `tableSize` | `'small' \| 'middle' \| 'large'` | 表格尺寸 |
| `emptyText` | `string` | 空数据提示文案 |

表达式上下文说明：

| 变量 | 含义 | 在表格列模板中的典型用法 |
|------|------|------|
| `$root` | 整个页面的当前数据模型（`dataModel`） | 跨字段拼接，如 `${$root.currency}${$current.salary}` |
| `$current` | 当前行记录对象（当前单元格所在行） | 读取行字段，如 `${$current.name}`、`${$current.salary}` |
| `$parent` | 当前表格的数据数组（即 `data.path` 绑定结果） | 需要参考整表数据时使用，如 `${$parent.length}` |

对应的 `dataModel` 示例：

```json
{
  "employees": [
    { "id": "u1", "name": "王欣", "department": "研发", "onboarded": true, "status": "在职", "salary": 28000 },
    { "id": "u2", "name": "李楠", "department": "产品", "onboarded": false, "status": "试用", "salary": 22000 }
  ]
}
```

## 双版本架构

### 表单版 (`faui`)

默认导入。包含 ~47 个组件，覆盖表单场景：

- **布局**: box, flex, grid/row/col, space, layout (header/sider/content/footer), divider
- **表单输入**: form, input, textarea, select, radio, checkbox, datepicker, timepicker, upload, switch, inputnumber, slider, rate, cascader, treeselect, colorpicker, transfer, autocomplete, mentions, button, calendar, segmented
- **辅助**: text, icon, typography, alert, tag, spin, skeleton, progress, modal, drawer, tooltip, popover, popconfirm
- **逻辑**: condition, repeater

### 完整版 (`@lawlietfeng/faui-sdk/full`)

包含全部 66+ 组件，在表单版基础上额外提供：table, list, card, tabs, menu, steps, collapse, image, descriptions, avatar, badge, empty, statistic, timeline, qrcode, watermark, carousel, tree, tour, pagination, dropdown, floatbutton, affix, anchor, stepindicator, chart 等。

### 构建产物

```
dist/
  index.js / index.mjs      # 表单版
  full.js / full.mjs         # 完整版
  chunk-*.mjs                # 共享代码（ESM 自动 code-split）
  index.d.ts / full.d.ts     # 类型声明
```

## 扩展组件

```tsx
import { Renderer, registerComponent } from '@lawlietfeng/faui-sdk';
import { CustomComponent } from './CustomComponent';

registerComponent('custom', CustomComponent);
```

你也可以通过 `customComponents` prop 在渲染时注入自定义组件，无需全局注册。

## API

### Renderer

| 属性 | 类型 | 说明 |
|------|------|------|
| `schema` | `Activity[]` | JSON Schema 数据（包含 ACTIVITY_SNAPSHOT + 可选 ACTIVITY_DELTA） |
| `componentRegistry` | `Record<string, FC>` | 组件注册表（可选，表单版/完整版各有默认值） |
| `initialData` | `DataModel` | 初始数据（可选） |
| `customComponents` | `Record<string, FC>` | 自定义组件，会与注册表合并（可选） |
| `httpRequest` | `(config) => Promise` | HTTP 请求函数 |
| `onAction` | `(action, context) => void` | Action 执行回调 |

### SchemaRenderer

| 属性 | 类型 | 说明 |
|------|------|------|
| `schema` | `Content` | 纯 UI 描述（`{ components, dataModel }`） |
| `componentRegistry` | `Record<string, FC>` | 组件注册表（**必填**） |
| `initialData` | `DataModel` | 初始数据（可选） |
| `customComponents` | `Record<string, FC>` | 自定义组件（可选） |
| `httpRequest` | `(config) => Promise` | HTTP 请求函数 |
| `onAction` | `(action, context) => void` | Action 执行回调 |

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck
```

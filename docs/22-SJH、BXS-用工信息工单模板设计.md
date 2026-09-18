# SJH、BXS 用工信息工单模板设计

对应模板：[examples/schemas/22-SJH、BXS.json](../examples/schemas/22-SJH、BXS.json)。

## 1. 目标与边界

此模板用于在工单页面中展示一张“用工信息”卡片，覆盖 SJH、BXS 两类工单的公共字段和差异字段。

- 页面只读，不使用 `form` 组件，也不存在提交与校验。
- 后端按约定组装 `dataModel`，前端 JSON 不判断工单类型。
- 证件号、联系电话直接展示完整值。
- 复制动作始终复制 `form` 中的原始值，并在成功后提示“复制成功”。
- 字段显示规则由 `ui` 数据控制；SJH、BXS 的差异不会写死在组件配置中。

## 2. 设计过程与选择

### 2.1 为什么拆分 `form` 与 `ui`

`form` 保存业务事实，`ui` 保存展示决策。两者分开后，接口字段、页面状态和工单差异不会混在一起。

| 命名空间 | 保存内容 | 示例 |
| --- | --- | --- |
| `form` | 员工、客户、合同、标签、业务链接等原始数据 | `form.employee.phone` |
| `ui` | 字段是否渲染等展示状态 | `ui.fieldVisible.contractType` |

不在数据中保存 `workOrderType`，也不让页面根据 `SJH`、`BXS` 推导规则。后端根据工单场景输出每个字段的显示布尔值；页面只执行渲染。这使新增工单类型或调整字段规则时，不需要修改组件树。

例如 BXS 不展示合同开始日期、合同结束日期、工作城市和合同类型时，后端返回：

```json
{
  "ui": {
    "fieldVisible": {
      "contractStartDate": false,
      "contractEndDate": false,
      "workCity": false,
      "contractType": false
    }
  }
}
```

### 2.2 为什么不用 `descriptions`

`descriptions` 适合纯文本键值对，但其 `options.value` 不能嵌入 FAUI 子组件。因此无法同时满足以下需求：

- 字段值后放复制图标；
- 长文本省略并展示 tooltip；
- 每个字段独立控制显示；
- 移动端按断点切换列数。

模板改用 `row`、`col` 和 `flex` 拼出字段项。代价是组件数量更多，但交互、显隐与响应式行为都保持在 JSON 中，后续扩展风险更低。

### 2.3 为什么不用标准 `card`

标准 `card` 的标题只能是文本，不能在标题右侧放“查看全部用工信息”这类操作。模板用带边框和圆角的 `box` 作为卡片容器，内部单独实现头部 `flex`，从而同时拥有标题和右侧操作区。

### 2.4 标签为什么使用数组和 `repeater`

员工标签、用工标签都不是固定数量，也不能根据标签名称在前端判断颜色。因此数据统一使用 `{ content, color }` 数组，`repeater` 为每项重复渲染一个 `tag`。

后端可调整标签数量、顺序和颜色，页面无需变更。

## 3. 数据模型约定

```text
dataModel
├── form                         业务原始数据
│   ├── employee
│   │   ├── name
│   │   ├── idCardNo
│   │   ├── phone
│   │   ├── email
│   │   └── tags[]               { content, color }
│   └── employment
│       ├── tags[]               { content, color }
│       ├── customerCode
│       ├── customerName
│       ├── contractStartDate
│       ├── contractEndDate
│       ├── workCity
│       ├── contractSubject
│       ├── contractType
│       └── allEmploymentInfoUrl
└── ui                           展示控制数据
    └── fieldVisible
        ├── employeeName
        ├── employeeTags
        ├── employmentTags
        └── 各业务字段的显示布尔值
```

约定如下：

- 文本业务字段缺失时返回 `null`，页面通过 `?? '—'` 展示占位符。
- `idCardNo`、`phone` 只保留完整原始值，不维护第二份脱敏值。
- 标签颜色由后端传入 Ant Design 支持的颜色名或合法 CSS 颜色，例如 `red`、`blue`、`#1677ff`。
- `fieldVisible` 的键采用字段语义命名，不使用 `showSJHFields` 这类和工单类型绑定的命名。

## 4. 组件结构与职责

```text
root: box
└── employment-info-card: box
    ├── card-header: flex
    │   ├── card-title: typography
    │   └── all-employment-link: typography(link)
    ├── employment-summary: flex
    │   ├── employee-name-group: flex
    │   ├── employee-tags: repeater → tag
    │   └── employment-tags: repeater → tag
    └── employment-fields: row
        └── 各字段 col
            └── 字段名 + 字段值 + 可选复制 button/icon
```

| 需求 | 组件选择 | 原因 |
| --- | --- | --- |
| 页面与卡片外观 | `box` | 支持自定义边框、圆角、内边距和标题区。 |
| 标题栏左右布局 | `flex` | 能稳定实现标题与操作区两端对齐。 |
| 字段区域 | `row` + `col` | 桌面端三列、平板两列、手机一列。 |
| 文本、链接、省略 | `typography` | 支持表达式、链接、`ellipsis` 与 tooltip。 |
| 标签组 | `repeater` + `tag` | 由数据驱动可变数量、颜色和顺序。 |
| 复制入口 | `button` + `icon` | 复制是操作而非单纯展示，按钮负责 `on_tap`，图标负责视觉表现。 |

## 5. 从 JSON 到页面的渲染过程

1. 渲染器读取 `ACTIVITY_SNAPSHOT.content`，以 `components` 建立 `id → 组件配置` 映射。
2. 根节点固定为 `root`，`children` 中的组件 ID 决定页面树与显示顺序。
3. `typography.content`、`tag.content`、`tag.color` 中的 `${...}` 在当前 `dataModel` 上求值。
4. `visible: "${$root.ui.fieldVisible.xxx}"` 在每次 `ui` 更新后重新求值；为 `false` 的字段列不渲染。
5. `repeater` 从 `data.path` 读取标签数组，为每项建立 `$current` 上下文，因此标签项可以读取 `${$current.content}` 与 `${$current.color}`。
6. `row` + `col` 根据断点渲染：`xl: 8` 为三列，`md: 12` 为两列，`xs: 24` 为一列。

表达式统一从 `$root` 读取根数据，例如：

```json
{
  "content": "${$root.form.employment.contractSubject ?? '—'}",
  "visible": "${$root.ui.fieldVisible.contractSubject}"
}
```

这避免了组件读取接口字段名，也使数据来源和展示规则一眼可见。

## 6. 交互设计

### 6.1 复制

复制按钮配置为动作数组：先执行 `copy`，再执行 `message`。`copy` 读取完整业务值，与页面显示状态无关。

```json
[
  {
    "action": "copy",
    "payload": {
      "text": "${$root.form.employee.phone}"
    }
  },
  {
    "action": "message",
    "payload": {
      "type": "success",
      "content": "复制成功",
      "duration": 2
    }
  }
]
```

`message` 是内置动作。`copy` 目前需要宿主或运行时注册执行器；示例应用已注册 Clipboard API 实现。生产宿主应在复制失败时抛出异常或给出错误提示，避免失败后仍提示“复制成功”。

### 6.2 嵌入页面与父组件通信

当前模板仍以 `typography(link)` 打开 `allEmploymentInfoUrl`，这是模板创建时的临时实现。页面嵌入父组件后，“查看全部用工信息”应改为 `postMessage`，而不是直接导航。

SDK 已提供内置动作 `post_message`，约定：

```json
{
  "action": "post_message",
  "payload": {
    "type": "faui:view_all_employment",
    "data": {
      "employeeId": "mock-001"
    },
    "targetOrigin": "https://parent.example.com"
  }
}
```

SDK 会调用：

```ts
window.parent.postMessage(
  {
    type: payload.type,
    data: payload.data,
  },
  payload.targetOrigin,
);
```

父页面仍需确认 `type`、`data` 字段和 `targetOrigin`。禁止使用 `*` 作为 `targetOrigin`；父页面接收消息时也必须校验 `event.origin`。确认消息协议后，再将模板的链接组件替换为触发该动作的按钮或链接样式按钮。详细配置见 [`docs/actions/post_message.md`](./actions/post_message.md)。

## 7. 可演示的分享顺序

1. 先展示目标：一张可适配 SJH、BXS 的只读用工信息卡片。
2. 说明核心决策：后端负责输出事实数据和展示规则，前端 JSON 只负责渲染。
3. 展示 `form` / `ui` 数据模型，以及 BXS 如何通过四个 `false` 隐藏差异字段。
4. 对比组件选择：为什么不选 `descriptions`、标准 `card`，为什么选 `box`、`row`、`col`、`flex`、`repeater`。
5. 演示标签数据驱动、字段响应式布局和复制提示。
6. 最后说明嵌入式场景的 `postMessage` 扩展边界与安全约束。

## 8. 验证结果

已完成：

- JSON 格式、唯一组件 ID、全部 `children` 引用校验通过。
- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm run test` 通过，31 个测试文件、430 个测试通过。

未做浏览器交互验证。接入父页面后，需要人工验证复制权限、Clipboard API 可用性、`postMessage` 的来源校验及 BXS 字段隐藏效果。

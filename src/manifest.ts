// Keep this module free of renderer and component imports so documentation sites can load it independently.
export const componentCategories = [
  { id: 'layout', title: '布局', description: '页面结构、容器和间距。' },
  { id: 'form', title: '表单与数据录入', description: '数据收集、编辑和提交。' },
  { id: 'display', title: '数据展示', description: '文本、数据、媒体和状态展示。' },
  { id: 'navigation', title: '导航', description: '页面切换、定位和流程引导。' },
  { id: 'feedback', title: '反馈与浮层', description: '操作反馈、提示和浮层交互。' },
  { id: 'logic', title: '逻辑与控制流', description: '条件渲染和重复渲染。' },
  { id: 'visualization', title: '数据可视化', description: '图表和可视化内容。' },
] as const;

export type ComponentCategoryId = typeof componentCategories[number]['id'];
export type ComponentAvailability = 'form-full' | 'full';

export interface ComponentManifestItem {
  slug: string;
  title: string;
  summary: string;
  category: ComponentCategoryId;
  availability: ComponentAvailability;
  registryNames: readonly string[];
}

export const componentDefinitions = [
  { slug: 'box', title: 'Box', summary: '通用布局容器。', category: 'layout', availability: 'form-full', registryNames: ['box'] },
  { slug: 'flex', title: 'Flex', summary: '弹性布局容器。', category: 'layout', availability: 'form-full', registryNames: ['flex'] },
  { slug: 'grid', title: '栅格布局', summary: '基于 Row 和 Col 的响应式栅格布局。', category: 'layout', availability: 'form-full', registryNames: ['grid', 'row', 'col'] },
  { slug: 'space', title: 'Space', summary: '为子元素提供统一间距。', category: 'layout', availability: 'form-full', registryNames: ['space'] },
  { slug: 'layout', title: 'Layout', summary: '页面整体布局及其区域容器。', category: 'layout', availability: 'form-full', registryNames: ['layout', 'header', 'sider', 'content', 'footer'] },
  { slug: 'divider', title: 'Divider', summary: '内容分隔线。', category: 'layout', availability: 'form-full', registryNames: ['divider'] },

  { slug: 'form', title: 'Form', summary: '表单容器与校验上下文。', category: 'form', availability: 'form-full', registryNames: ['form'] },
  { slug: 'input', title: 'Input', summary: '单行文本输入。', category: 'form', availability: 'form-full', registryNames: ['input'] },
  { slug: 'textarea', title: 'Textarea', summary: '多行文本输入。', category: 'form', availability: 'form-full', registryNames: ['textarea'] },
  { slug: 'select', title: 'Select', summary: '下拉选择。', category: 'form', availability: 'form-full', registryNames: ['select'] },
  { slug: 'radio', title: 'Radio', summary: '单项选择。', category: 'form', availability: 'form-full', registryNames: ['radio'] },
  { slug: 'checkbox', title: 'Checkbox', summary: '复选与多项选择。', category: 'form', availability: 'form-full', registryNames: ['checkbox'] },
  { slug: 'datepicker', title: 'DatePicker', summary: '日期选择。', category: 'form', availability: 'form-full', registryNames: ['datepicker'] },
  { slug: 'timepicker', title: 'TimePicker', summary: '时间选择。', category: 'form', availability: 'form-full', registryNames: ['timepicker'] },
  { slug: 'upload', title: 'Upload', summary: '文件上传。', category: 'form', availability: 'form-full', registryNames: ['upload'] },
  { slug: 'switch', title: 'Switch', summary: '开关选择。', category: 'form', availability: 'form-full', registryNames: ['switch'] },
  { slug: 'inputnumber', title: 'InputNumber', summary: '数字输入。', category: 'form', availability: 'form-full', registryNames: ['inputnumber'] },
  { slug: 'slider', title: 'Slider', summary: '滑动数值选择。', category: 'form', availability: 'form-full', registryNames: ['slider'] },
  { slug: 'rate', title: 'Rate', summary: '评分选择。', category: 'form', availability: 'form-full', registryNames: ['rate'] },
  { slug: 'cascader', title: 'Cascader', summary: '级联选择。', category: 'form', availability: 'form-full', registryNames: ['cascader'] },
  { slug: 'treeselect', title: 'TreeSelect', summary: '树形选择。', category: 'form', availability: 'form-full', registryNames: ['treeselect'] },
  { slug: 'colorpicker', title: 'ColorPicker', summary: '颜色选择。', category: 'form', availability: 'form-full', registryNames: ['colorpicker'] },
  { slug: 'transfer', title: 'Transfer', summary: '穿梭选择。', category: 'form', availability: 'form-full', registryNames: ['transfer'] },
  { slug: 'autocomplete', title: 'AutoComplete', summary: '带建议的文本输入。', category: 'form', availability: 'form-full', registryNames: ['autocomplete'] },
  { slug: 'mentions', title: 'Mentions', summary: '提及输入。', category: 'form', availability: 'form-full', registryNames: ['mentions'] },
  { slug: 'button', title: 'Button', summary: '触发操作的按钮。', category: 'form', availability: 'form-full', registryNames: ['button'] },
  { slug: 'calendar', title: 'Calendar', summary: '日期面板与日期选择。', category: 'form', availability: 'form-full', registryNames: ['calendar'] },
  { slug: 'segmented', title: 'Segmented', summary: '分段控制器。', category: 'form', availability: 'form-full', registryNames: ['segmented'] },

  { slug: 'text', title: 'Text', summary: '基础文本展示。', category: 'display', availability: 'form-full', registryNames: ['text'] },
  { slug: 'icon', title: 'Icon', summary: '图标展示。', category: 'display', availability: 'form-full', registryNames: ['icon'] },
  { slug: 'typography', title: 'Typography', summary: '排版文本展示。', category: 'display', availability: 'form-full', registryNames: ['typography'] },
  { slug: 'tag', title: 'Tag', summary: '标签展示。', category: 'display', availability: 'form-full', registryNames: ['tag'] },
  { slug: 'skeleton', title: 'Skeleton', summary: '内容加载占位。', category: 'display', availability: 'form-full', registryNames: ['skeleton'] },
  { slug: 'progress', title: 'Progress', summary: '进度展示。', category: 'display', availability: 'form-full', registryNames: ['progress'] },

  { slug: 'alert', title: 'Alert', summary: '静态提示信息。', category: 'feedback', availability: 'form-full', registryNames: ['alert'] },
  { slug: 'spin', title: 'Spin', summary: '加载状态提示。', category: 'feedback', availability: 'form-full', registryNames: ['spin'] },
  { slug: 'modal', title: 'Modal', summary: '模态对话框。', category: 'feedback', availability: 'form-full', registryNames: ['modal'] },
  { slug: 'drawer', title: 'Drawer', summary: '侧边抽屉。', category: 'feedback', availability: 'form-full', registryNames: ['drawer'] },
  { slug: 'tooltip', title: 'Tooltip', summary: '文字提示浮层。', category: 'feedback', availability: 'form-full', registryNames: ['tooltip'] },
  { slug: 'popover', title: 'Popover', summary: '承载内容的浮层。', category: 'feedback', availability: 'form-full', registryNames: ['popover'] },
  { slug: 'popconfirm', title: 'Popconfirm', summary: '二次确认浮层。', category: 'feedback', availability: 'form-full', registryNames: ['popconfirm'] },

  { slug: 'condition', title: 'Condition', summary: '根据表达式条件渲染内容。', category: 'logic', availability: 'form-full', registryNames: ['condition'] },
  { slug: 'repeater', title: 'Repeater', summary: '根据数据集合重复渲染内容。', category: 'logic', availability: 'form-full', registryNames: ['repeater'] },

  { slug: 'avatar', title: 'Avatar', summary: '头像展示。', category: 'display', availability: 'full', registryNames: ['avatar'] },
  { slug: 'badge', title: 'Badge', summary: '徽标与状态角标。', category: 'display', availability: 'full', registryNames: ['badge'] },
  { slug: 'empty', title: 'Empty', summary: '空状态展示。', category: 'display', availability: 'full', registryNames: ['empty'] },
  { slug: 'statistic', title: 'Statistic', summary: '统计数值展示。', category: 'display', availability: 'full', registryNames: ['statistic'] },
  { slug: 'timeline', title: 'Timeline', summary: '时间轴展示。', category: 'display', availability: 'full', registryNames: ['timeline'] },
  { slug: 'qrcode', title: 'QRCode', summary: '二维码展示。', category: 'display', availability: 'full', registryNames: ['qrcode'] },
  { slug: 'watermark', title: 'Watermark', summary: '水印容器。', category: 'display', availability: 'full', registryNames: ['watermark'] },
  { slug: 'list', title: 'List', summary: '列表展示。', category: 'display', availability: 'full', registryNames: ['list'] },
  { slug: 'table', title: 'Table', summary: '表格数据展示。', category: 'display', availability: 'full', registryNames: ['table'] },
  { slug: 'card', title: 'Card', summary: '卡片内容容器。', category: 'display', availability: 'full', registryNames: ['card'] },
  { slug: 'collapse', title: 'Collapse', summary: '可折叠内容面板。', category: 'display', availability: 'full', registryNames: ['collapse'] },
  { slug: 'image', title: 'Image', summary: '图片展示与预览。', category: 'display', availability: 'full', registryNames: ['image'] },
  { slug: 'descriptions', title: 'Descriptions', summary: '描述列表展示。', category: 'display', availability: 'full', registryNames: ['descriptions'] },

  { slug: 'pagination', title: 'Pagination', summary: '分页导航。', category: 'navigation', availability: 'full', registryNames: ['pagination'] },
  { slug: 'tabs', title: 'Tabs', summary: '标签页切换。', category: 'navigation', availability: 'full', registryNames: ['tabs'] },
  { slug: 'menu', title: 'Menu', summary: '菜单导航。', category: 'navigation', availability: 'full', registryNames: ['menu'] },
  { slug: 'tree', title: 'Tree', summary: '树形结构展示与选择。', category: 'navigation', availability: 'full', registryNames: ['tree'] },
  { slug: 'steps', title: 'Steps', summary: '步骤流程展示。', category: 'navigation', availability: 'full', registryNames: ['steps'] },
  { slug: 'stepindicator', title: 'StepIndicator', summary: '轻量步骤指示器。', category: 'navigation', availability: 'full', registryNames: ['stepindicator'] },
  { slug: 'carousel', title: 'Carousel', summary: '轮播内容展示。', category: 'navigation', availability: 'full', registryNames: ['carousel'] },
  { slug: 'tour', title: 'Tour', summary: '功能引导浮层。', category: 'navigation', availability: 'full', registryNames: ['tour'] },
  { slug: 'dropdown', title: 'Dropdown', summary: '下拉菜单。', category: 'navigation', availability: 'full', registryNames: ['dropdown'] },
  { slug: 'floatbutton', title: 'FloatButton', summary: '悬浮操作按钮。', category: 'navigation', availability: 'full', registryNames: ['float_button'] },
  { slug: 'affix', title: 'Affix', summary: '固定在视口位置的内容。', category: 'navigation', availability: 'full', registryNames: ['affix'] },
  { slug: 'anchor', title: 'Anchor', summary: '页内锚点导航。', category: 'navigation', availability: 'full', registryNames: ['anchor'] },

  { slug: 'chart', title: 'Chart', summary: '基于 ECharts 的图表展示。', category: 'visualization', availability: 'full', registryNames: ['chart'] },
] as const satisfies readonly ComponentManifestItem[];

type ComponentDefinition = typeof componentDefinitions[number];
type FormComponentDefinition = Extract<ComponentDefinition, { readonly availability: 'form-full' }>;

export type FormComponentName = FormComponentDefinition['registryNames'][number];
export type FullComponentName = ComponentDefinition['registryNames'][number];

export const formComponentNames = componentDefinitions
  .filter((component): component is FormComponentDefinition => component.availability === 'form-full')
  .flatMap((component) => component.registryNames);

export const fullOnlyComponentNames = componentDefinitions
  .filter((component) => component.availability === 'full')
  .flatMap((component) => component.registryNames);

export const fullComponentNames = componentDefinitions.flatMap((component) => component.registryNames);

export const componentManifest = {
  manifestVersion: 1,
  framework: 'react',
  categories: componentCategories,
  components: componentDefinitions,
  editions: {
    form: {
      title: 'Form Edition',
      componentNames: formComponentNames,
    },
    full: {
      title: 'Full Edition',
      componentNames: fullComponentNames,
    },
  },
} as const;

// Form contracts are exported from this static manifest entry point so that
// `@faui/react/manifest` remains safe for documentation and agent consumers.
export {
  formComponentContractVersion,
  formComponentContracts,
  formSchemaContract,
} from './formComponentContracts';
export type {
  BindingKind,
  ChildrenMode,
  ContractDependency,
  ContractSchema,
  DataModelBindingContract,
  EventContract,
  FormComponentContract,
  PropertyBindingContract,
  PropertyContract,
} from './formComponentContracts';

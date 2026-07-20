import type { Operation } from 'fast-json-patch';
import type { FC } from 'react';
import type { AnimationPreset, AnimationConfig } from './animation';

// JSON Schema 类型定义

export type Activity = ActivitySnapshot | ActivityDelta;

export interface ActivitySnapshot {
  type: 'ACTIVITY_SNAPSHOT';
  content: Content;
}

export type PatchOperation = Exclude<Operation, { op: '_get' }>;

export interface ActivityDelta {
  type: 'ACTIVITY_DELTA';
  eventType?: string;
  messageId?: string;
  activityType?: string;
  patch: PatchOperation[];
}

export interface Content {
  components: Component[];
  dataModel: DataModel;
}

export type DataModel = Record<string, unknown>;

export interface ValidationResult {
  valid: boolean;
  formId: string;
  data: DataModel;
  errors: Record<string, string>;
}

export interface SubmitOptions {
  validate?: boolean;
}

export type SubmitStatus = 'submitted' | 'validation_failed' | 'busy' | 'error' | 'no_handler';

export interface SubmitContext {
  formId: string;
  validated: boolean;
  validation?: ValidationResult;
  source: 'external';
}

export interface SubmitResult {
  success: boolean;
  status: SubmitStatus;
  formId: string;
  data: DataModel;
  validation?: ValidationResult;
  error?: unknown;
}

export type OnValidateHandler = (
  data: DataModel,
  context: { formId: string },
) => ValidationResult | Promise<ValidationResult>;

export type OnSubmitHandler = (
  data: DataModel,
  context: SubmitContext,
) => void | Promise<void>;

export interface ValueBinding {
  path: string;
}

export type ExpressionValue = string;

export interface ExpressionContext {
  $root: DataModel;
  $current?: unknown;
  $parent?: unknown;
  $result?: unknown;
  $error?: unknown;
  [key: string]: unknown;
}

export type ActionContext = ExpressionContext;
export type ComponentVisibility = boolean | ExpressionValue | ValueBinding;
export type ComponentControlValue = boolean | ExpressionValue | ValueBinding;
export type ComponentStyle = Record<string, string | number>;

export interface ComponentOption {
  label: string;
  value: string | number | boolean;
  children?: ComponentOption[];
}

export type ComponentOptionItem = ComponentOption | string | number | boolean | Record<string, unknown>;
export type ComponentOptions = ComponentOptionItem[] | string;

export type ActionSequence = ActionConfig | ActionConfig[];

export interface ActionConfig {
  action: ActionType;
  path?: string;
  value?: unknown;
  payload?: ActionPayload;
  on_success?: ActionSequence;
  on_error?: ActionSequence;
}

export type ActionType =
  | 'update_data'
  | 'http_proxy'
  | 'message'
  | 'notification'
  | 'copy'
  | 'mcp_tool_call'
  | 'send_prompt'
  | 'input_prompt';

export interface ActionPayload {
  http_config?: HttpConfig;
  http_body?: unknown;
  [key: string]: unknown;
}

export interface HttpConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  headers?: Record<string, string>;
}

export interface HttpRequestConfig {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export type HttpRequestHandler = (config: HttpRequestConfig) => Promise<unknown>;

export interface ActionExecutor {
  updateData: (path: string, value: unknown) => void;
  getData: (path: string) => unknown;
  httpRequest?: HttpRequestHandler;
  context: ActionContext;
}

export type ActionHandler = (config: ActionConfig, executor: ActionExecutor) => unknown | Promise<unknown>;
export type ActionRegistry = Record<string, ActionHandler>;
export type ExternalActionHandler = (action: ActionConfig, context: ActionContext) => void | Promise<void>;

export interface Step {
  id: string;
  title: string;
  status: 'success' | 'running' | 'pending' | 'error';
}

export interface TimelineItemType {
  color?: string;
  label?: string;
  content?: string;
  position?: 'left' | 'right';
}

export interface TableColumn {
  title: string;
  dataIndex: string;
  key?: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  template?: string;
  component?: string;
  renderAs?: 'text' | 'checkbox' | 'tag';
  statusColors?: Record<string, string>;
}

export interface TablePagination {
  pageSize?: number;
}

export type ValidateTrigger = 'onChange' | 'onBlur';

export interface FormRule {
  required?: boolean;
  message?: string;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url';
  min?: number;
  max?: number;
  len?: number;
  pattern?: string;
  whitespace?: boolean;
  enum?: Array<string | number | boolean>;
  validator?: unknown;
}

export interface BaseComponentConfig {
  id: string;
  name?: string;
  // 真实 DOM 的 id，用于锚点或特定查找
  domId?: string;
  // 基础样式和内容
  style?: ComponentStyle;
  className?: string;
  content?: string;
  // 值绑定和显隐控制
  value?: ValueBinding;
  visible?: ComponentVisibility;
  // 容器属性
  children?: string[];
  // 事件
  on_change?: ActionSequence;
  on_tap?: ActionSequence;
  on_mount?: ActionSequence;

  // -- 通用字段属性 --
  field?: string;
  rules?: FormRule[];
  validateTrigger?: ValidateTrigger | ValidateTrigger[];
  label?: string;
  placeholder?: string;
  options?: ComponentOptions;
  checked?: ValueBinding;
  data?: ValueBinding;
  title?: string;
  color?: string;
  // 动画
  animation?: AnimationPreset | AnimationConfig;
  [key: string]: unknown;
}

export * from './components';

export type Component =
  | import('./components').AlertComponentConfig
  | import('./components').AutocompleteComponentConfig
  | import('./components').AvatarComponentConfig
  | import('./components').BadgeComponentConfig
  | import('./components').BoxComponentConfig
  | import('./components').ButtonComponentConfig
  | import('./components').CalendarComponentConfig
  | import('./components').CardComponentConfig
  | import('./components').CarouselComponentConfig
  | import('./components').CascaderComponentConfig
  | import('./components').ChartComponentConfig
  | import('./components').CheckboxComponentConfig
  | import('./components').CollapseComponentConfig
  | import('./components').ColorpickerComponentConfig
  | import('./components').ColComponentConfig
  | import('./components').ContentComponentConfig
  | import('./components').DatepickerComponentConfig
  | import('./components').DescriptionsComponentConfig
  | import('./components').DividerComponentConfig
  | import('./components').EmptyComponentConfig
  | import('./components').FlexComponentConfig
  | import('./components').FooterComponentConfig
  | import('./components').FormComponentConfig
  | import('./components').HeaderComponentConfig
  | import('./components').IconComponentConfig
  | import('./components').ImageComponentConfig
  | import('./components').InputComponentConfig
  | import('./components').InputnumberComponentConfig
  | import('./components').LayoutComponentConfig
  | import('./components').ListComponentConfig
  | import('./components').MentionsComponentConfig
  | import('./components').MenuComponentConfig
  | import('./components').ModalComponentConfig
  | import('./components').DrawerComponentConfig
  | import('./components').PopoverComponentConfig
  | import('./components').TooltipComponentConfig
  | import('./components').PopconfirmComponentConfig
  | import('./components').DropdownComponentConfig
  | import('./components').FloatButtonComponentConfig
  | import('./components').AffixComponentConfig
  | import('./components').AnchorComponentConfig
  | import('./components').ConditionComponentConfig
  | import('./components').RepeaterComponentConfig
  | import('./components').PaginationComponentConfig
  | import('./components').ProgressComponentConfig
  | import('./components').QrcodeComponentConfig
  | import('./components').RadioComponentConfig
  | import('./components').RateComponentConfig
  | import('./components').RowComponentConfig
  | import('./components').SegmentedComponentConfig
  | import('./components').SelectComponentConfig
  | import('./components').SiderComponentConfig
  | import('./components').SkeletonComponentConfig
  | import('./components').SliderComponentConfig
  | import('./components').SpaceComponentConfig
  | import('./components').SpinComponentConfig
  | import('./components').StatisticComponentConfig
  | import('./components').StepindicatorComponentConfig
  | import('./components').StepsComponentConfig
  | import('./components').SwitchComponentConfig
  | import('./components').TableComponentConfig
  | import('./components').TabsComponentConfig
  | import('./components').TagComponentConfig
  | import('./components').TextareaComponentConfig
  | import('./components').TextComponentConfig
  | import('./components').TimelineComponentConfig
  | import('./components').TimepickerComponentConfig
  | import('./components').TourComponentConfig
  | import('./components').TransferComponentConfig
  | import('./components').TreeComponentConfig
  | import('./components').TreeselectComponentConfig
  | import('./components').TypographyComponentConfig
  | import('./components').UploadComponentConfig
  | import('./components').WatermarkComponentConfig
  | GenericComponentConfig;

export interface GenericComponentConfig extends BaseComponentConfig {
  component: string;
}

export type ComponentType =
  | 'alert'
  | 'autocomplete'
  | 'avatar'
  | 'badge'
  | 'box'
  | 'button'
  | 'calendar'
  | 'card'
  | 'carousel'
  | 'cascader'
  | 'chart'
  | 'checkbox'
  | 'collapse'
  | 'colorpicker'
  | 'col'
  | 'condition'
  | 'content'
  | 'datepicker'
  | 'descriptions'
  | 'divider'
  | 'empty'
  | 'flex'
  | 'footer'
  | 'form'
  | 'header'
  | 'icon'
  | 'image'
  | 'input'
  | 'inputnumber'
  | 'layout'
  | 'list'
  | 'mentions'
  | 'menu'
  | 'modal'
  | 'drawer'
  | 'popover'
  | 'tooltip'
  | 'popconfirm'
  | 'dropdown'
  | 'float_button'
  | 'affix'
  | 'anchor'
  | 'pagination'
  | 'progress'
  | 'qrcode'
  | 'radio'
  | 'rate'
  | 'repeater'
  | 'row'
  | 'segmented'
  | 'select'
  | 'sider'
  | 'skeleton'
  | 'slider'
  | 'space'
  | 'spin'
  | 'statistic'
  | 'stepindicator'
  | 'steps'
  | 'switch'
  | 'table'
  | 'tabs'
  | 'tag'
  | 'textarea'
  | 'text'
  | 'timeline'
  | 'timepicker'
  | 'tour'
  | 'transfer'
  | 'tree'
  | 'treeselect'
  | 'typography'
  | 'upload'
  | 'watermark';

export type ExtractComponent<T extends ComponentType> = Extract<Component, { component: T }>;

export type ComponentMap = Map<string, Component>;

export interface ComponentRendererProps<TComponent extends Component = Component> {
  config: TComponent;
  componentMap: ComponentMap;
}

export type RendererComponent<TComponent extends Component = Component> = FC<
  ComponentRendererProps<TComponent>
>;

export type ComponentRegistry = Record<string, RendererComponent>;

import type { Operation } from "fast-json-patch";
import type { ComponentType as ReactComponentType } from "react";

export type Activity = ActivitySnapshot | ActivityDelta;

export interface ActivitySnapshot {
  type: "ACTIVITY_SNAPSHOT";
  content: Content;
}

export type PatchOperation = Exclude<Operation, { op: "_get" }>;

export interface ActivityDelta {
  type: "ACTIVITY_DELTA";
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

export type ComponentVisibility = boolean | ExpressionValue | ValueBinding;

export type ComponentControlValue = boolean | ExpressionValue | ValueBinding;

export type ComponentStyleValue = string | number;

export type ComponentStyle = Record<string, ComponentStyleValue>;

export type ActionType =
  | "update_data"
  | "http_proxy"
  | "message"
  | "notification"
  | "copy"
  | "mcp_tool_call"
  | "send_prompt"
  | "input_prompt";

export type ActionSequence = ActionConfig | ActionConfig[];

export interface HttpConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  headers?: Record<string, string>;
}

export interface ActionPayload {
  http_config?: HttpConfig;
  http_body?: unknown;
  [key: string]: unknown;
}

export interface ActionConfig {
  action: ActionType;
  path?: string;
  value?: unknown;
  payload?: ActionPayload;
  on_success?: ActionSequence;
  on_error?: ActionSequence;
}

export interface HttpRequestConfig {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export type HttpRequestHandler = (config: HttpRequestConfig) => Promise<unknown>;

export type ActionContext = ExpressionContext;

export interface ActionExecutor {
  updateData: (path: string, value: unknown) => void;
  getData: (path: string) => unknown;
  httpRequest?: HttpRequestHandler;
  context: ActionContext;
}

export type ActionHandler = (config: ActionConfig, executor: ActionExecutor) => unknown | Promise<unknown>;

export type ActionRegistry = Record<string, ActionHandler>;

export type ExternalActionHandler = (action: ActionConfig, context: ActionContext) => void | Promise<void>;

export type ValidateTrigger = "onChange" | "onBlur";

export interface FormRule {
  required?: boolean;
  message?: string;
  type?: "string" | "number" | "boolean" | "array" | "object" | "email" | "url";
  min?: number;
  max?: number;
  len?: number;
  pattern?: string;
  whitespace?: boolean;
  enum?: Array<string | number | boolean>;
  validator?: unknown;
}

export interface ComponentOption {
  label: string;
  value: string | number | boolean;
  children?: ComponentOption[];
}

export type ComponentOptionItem = ComponentOption | string | number | boolean | Record<string, unknown>;

export type ComponentOptions = ComponentOptionItem[] | string;

export type ComponentType =
  | "form"
  | "input"
  | "button"
  | "condition"
  | "repeater"
  | "select"
  | "radio"
  | "checkbox"
  | "textarea"
  | "inputnumber"
  | "switch"
  | "datepicker"
  | "timepicker"
  | (string & {});

export interface BaseComponentConfig {
  id: string;
  name?: string;
  domId?: string;
  className?: string;
  title?: string;
  label?: string;
  placeholder?: string;
  children?: string[];
  value?: ValueBinding;
  data?: ValueBinding;
  checked?: ValueBinding;
  disabled?: ComponentControlValue;
  content?: string;
  style?: ComponentStyle;
  visible?: ComponentVisibility;
  field?: string;
  rules?: FormRule[];
  validateTrigger?: ValidateTrigger | ValidateTrigger[];
  options?: ComponentOptions;
  on_change?: ActionSequence;
  on_tap?: ActionSequence;
  on_mount?: ActionSequence;
  [key: string]: unknown;
}

export interface FormComponentConfig extends BaseComponentConfig {
  component: "form";
  submitButtonId?: string;
  layout?: "vertical" | "horizontal";
}

export interface InputComponentConfig extends BaseComponentConfig {
  component: "input";
}

export interface SelectComponentConfig extends BaseComponentConfig {
  component: "select";
  field?: string;
  placeholder?: string;
  options?: ComponentOptions;
  rules?: FormRule[];
  mode?: "multiple" | "tags";
  disabled?: ComponentControlValue;
  allowClear?: ComponentControlValue;
  showSearch?: ComponentControlValue;
  maxTagCount?: number | ExpressionValue;
}

export interface RadioComponentConfig extends BaseComponentConfig {
  component: "radio";
  field?: string;
  options?: ComponentOptions;
  rules?: FormRule[];
}

export interface CheckboxComponentConfig extends BaseComponentConfig {
  component: "checkbox";
  field?: string;
  options?: ComponentOptions;
  rules?: FormRule[];
  checked?: ValueBinding;
}

export interface TextareaComponentConfig extends BaseComponentConfig {
  component: "textarea";
  field?: string;
  placeholder?: string;
  rules?: FormRule[];
  disabled?: ComponentControlValue;
  rows?: number | ExpressionValue;
  maxLength?: number | ExpressionValue;
}

export interface InputnumberComponentConfig extends BaseComponentConfig {
  component: "inputnumber";
  field?: string;
  rules?: FormRule[];
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  disabled?: ComponentControlValue;
}

export interface SwitchComponentConfig extends BaseComponentConfig {
  component: "switch";
  field?: string;
  rules?: FormRule[];
  checkedChildren?: string;
  unCheckedChildren?: string;
  checked?: ValueBinding;
  disabled?: ComponentControlValue;
  size?: "small" | "default" | (string & {});
}

export interface DisabledDateConfig {
  before?: ValueBinding;
  after?: ValueBinding;
}

export interface DatepickerComponentConfig extends BaseComponentConfig {
  component: "datepicker";
  field?: string;
  placeholder?: string;
  rules?: FormRule[];
  picker?: "date" | "month" | "year";
  format?: string;
  showTime?: boolean;
  disabledDate?: DisabledDateConfig;
}

export interface TimepickerComponentConfig extends BaseComponentConfig {
  component: "timepicker";
  field?: string;
  rules?: FormRule[];
  format?: string;
  placeholder?: string;
  disabled?: ComponentControlValue;
  minuteStep?: number | ExpressionValue;
  secondStep?: number | ExpressionValue;
  hourStep?: number | ExpressionValue;
}

export interface ButtonComponentConfig extends BaseComponentConfig {
  component: "button";
  color?: string;
  disabled?: boolean;
  type?: "primary" | "dashed" | "link" | "text" | "default";
  danger?: boolean;
  ghost?: boolean;
  shape?: "default" | "circle" | "round";
  size?: "large" | "middle" | "small";
  block?: boolean;
}

export interface ConditionComponentConfig extends BaseComponentConfig {
  component: "condition";
  when?: boolean | ExpressionValue | ValueBinding;
  then?: string[];
  else?: string[];
  match?: ExpressionValue | ValueBinding;
  cases?: Record<string, string[]>;
  default?: string[];
}

export interface RepeaterComponentConfig extends BaseComponentConfig {
  component: "repeater";
  data?: ValueBinding;
  direction?: "vertical" | "horizontal";
  gap?: number;
  emptyContent?: string;
  keyField?: string;
}

export interface GenericComponentConfig extends BaseComponentConfig {
  component: ComponentType;
}

export type Component =
  | FormComponentConfig
  | InputComponentConfig
  | SelectComponentConfig
  | RadioComponentConfig
  | CheckboxComponentConfig
  | TextareaComponentConfig
  | InputnumberComponentConfig
  | SwitchComponentConfig
  | DatepickerComponentConfig
  | TimepickerComponentConfig
  | ButtonComponentConfig
  | ConditionComponentConfig
  | RepeaterComponentConfig
  | GenericComponentConfig;

export type ComponentMap = Map<string, Component>;

export interface ComponentRendererProps<TComponent extends Component = Component> {
  config: TComponent;
  componentMap: ComponentMap;
}

export type RendererComponent<TComponent extends Component = Component> = ReactComponentType<
  ComponentRendererProps<TComponent>
>;

export type ComponentRegistry = Record<string, RendererComponent>;

export interface SchemaRendererProps {
  schema: Content;
  componentRegistry: ComponentRegistry;
  initialData?: DataModel;
  liveData?: DataModel;
  customComponents?: ComponentRegistry;
  httpRequest?: HttpRequestHandler;
  onAction?: ExternalActionHandler;
}

export interface RendererProps extends Omit<SchemaRendererProps, "schema"> {
  schema: Activity[];
}

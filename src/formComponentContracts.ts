/**
 * Form Edition's machine-readable component contract.
 *
 * This module intentionally contains static, JSON-serialisable data only.  It
 * must remain safe to import from documentation generators and agents without
 * loading React, a renderer, or any component implementation.
 */

export type ContractPrimitive = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array' | 'unknown';
export type BindingKind = 'boolean' | 'expression' | 'path';
export type PathScope = 'root' | 'root-or-repeater-relative';

export interface ContractSchema {
  readonly type?: ContractPrimitive | readonly ContractPrimitive[];
  readonly enum?: readonly (string | number | boolean | null)[];
  readonly items?: ContractSchema;
  readonly properties?: Readonly<Record<string, ContractSchema>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean | ContractSchema;
  readonly anyOf?: readonly ContractSchema[];
  readonly [key: string]: unknown;
}

export interface PropertyBindingContract {
  readonly accepts: readonly BindingKind[];
  readonly pathScope?: PathScope;
  readonly expressionMode?: 'pure' | 'interpolation';
}

export interface DeprecatedPropertyContract {
  readonly replacement?: string;
  readonly reason: string;
}

export interface PropertyContract {
  readonly title?: string;
  readonly description?: string;
  readonly schema?: ContractSchema;
  readonly default?: unknown;
  readonly bindings?: PropertyBindingContract;
  readonly deprecated?: DeprecatedPropertyContract;
}

export interface EventContract {
  readonly description?: string;
  readonly valueContext?: '$value';
  readonly automaticWriteback?: 'only-when-event-absent' | 'never' | 'component-defined';
  readonly generationConflictWith?: readonly string[];
}

export type ChildrenMode =
  | 'none'
  | 'component-ids'
  | 'template-component-ids'
  | 'branch-component-ids'
  | 'button-trigger'
  | 'trigger-component-ids';

export type DataModelValueType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'unknown';

export interface DataModelBindingContract {
  readonly prop: 'value' | 'checked' | 'data';
  readonly valueTypes: readonly DataModelValueType[];
  readonly variants?: readonly {
    readonly when: Readonly<Record<string, unknown>>;
    readonly valueTypes: readonly DataModelValueType[];
  }[];
}

export interface ContractDependency {
  readonly requires?: string;
  readonly when?: string;
  readonly requiresOneOf?: readonly string[];
  readonly forbids?: readonly string[];
  readonly message?: string;
}

export interface FormComponentContract {
  readonly component: string;
  readonly registryNames: readonly string[];
  readonly documentationSlug: string;
  readonly allowedProps: readonly string[];
  readonly childrenMode: ChildrenMode;
  readonly properties: Readonly<Record<string, PropertyContract>>;
  /** Event names are kept as a simple list for consumers that only need names. */
  readonly eventNames: readonly string[];
  /** Structured event details are used by strict generators and documentation. */
  readonly events: Readonly<Record<string, EventContract>>;
  readonly dataModelBinding?: DataModelBindingContract;
  readonly dependencies?: readonly ContractDependency[];
  readonly deprecated?: Readonly<Record<string, DeprecatedPropertyContract>>;
  readonly notes?: readonly string[];
}

const schema = (type: ContractPrimitive | readonly ContractPrimitive[], extra: Omit<ContractSchema, 'type'> = {}): ContractSchema => ({ type, ...extra });
const stringSchema = schema('string');
const booleanSchema = schema('boolean');
const pathBinding: PropertyBindingContract = { accepts: ['path'], pathScope: 'root-or-repeater-relative' };
const rootPathBinding: PropertyBindingContract = { accepts: ['path'], pathScope: 'root' };
const booleanBinding: PropertyBindingContract = {
  accepts: ['boolean', 'expression', 'path'],
  pathScope: 'root-or-repeater-relative',
  expressionMode: 'pure',
};
const expressionBinding: PropertyBindingContract = {
  accepts: ['expression'],
  expressionMode: 'interpolation',
};
const pathObjectSchema: ContractSchema = schema('object', {
  properties: { path: stringSchema },
  required: ['path'],
  additionalProperties: false,
});
const baseProperties: Readonly<Record<string, PropertyContract>> = {
  id: { schema: stringSchema, description: '在 schema 中唯一的组件 ID。' },
  component: { schema: stringSchema, description: 'Form Registry 注册名。' },
  name: { schema: stringSchema },
  domId: { schema: stringSchema },
  style: { schema: schema('object', { additionalProperties: true }) },
  className: { schema: stringSchema },
  animation: { schema: schema('object') },
  visible: {
    schema: booleanSchema,
    bindings: booleanBinding,
    description: '控制组件是否渲染。',
  },
  on_mount: { schema: schema(['object', 'array']), description: '组件挂载时执行的 Action。' },
};

const contentProperty: PropertyContract = {
  schema: stringSchema,
  bindings: expressionBinding,
  description: '组件显示的文本内容。',
};
const labelProperty: PropertyContract = { schema: stringSchema, bindings: expressionBinding };
const disabledProperty: PropertyContract = { schema: booleanSchema, bindings: booleanBinding };
const valueProperty: PropertyContract = { schema: pathObjectSchema, bindings: pathBinding };
const checkedProperty: PropertyContract = { schema: pathObjectSchema, bindings: pathBinding };
const dataProperty: PropertyContract = { schema: pathObjectSchema, bindings: pathBinding };
const rootDataProperty: PropertyContract = { schema: pathObjectSchema, bindings: rootPathBinding };
const fieldProperty: PropertyContract = { schema: stringSchema, description: '表单校验字段名；不负责替代 value.path。' };
const rulesProperty: PropertyContract = { schema: schema('array', { items: schema('object') }) };
const optionsProperty: PropertyContract = { schema: schema(['array', 'string']), bindings: expressionBinding };
const onChangeEvent: EventContract = {
  description: '值变化时执行；配置后保持旧行为并覆盖 value/checked.path 的自动回写。',
  valueContext: '$value',
  automaticWriteback: 'only-when-event-absent',
  generationConflictWith: ['value', 'checked'],
};

const actionProperty: PropertyContract = { schema: schema(['object', 'array']) };
const childrenProperty: PropertyContract = { schema: schema('array', { items: stringSchema }) };
const broadStaticProperty: PropertyContract = {
  schema: schema(['string', 'number', 'boolean', 'object', 'array', 'null']),
};

function fallbackProperty(name: string): PropertyContract {
  if (name === 'children') return childrenProperty;
  if (name.startsWith('on_')) return actionProperty;
  if (name === 'rules') return rulesProperty;
  if (name === 'validateTrigger') return { schema: schema(['string', 'array']) };
  return broadStaticProperty;
}

const contract = (
  component: string,
  options: Partial<Omit<FormComponentContract, 'component' | 'registryNames' | 'documentationSlug' | 'allowedProps' | 'properties' | 'eventNames' | 'events'>> & {
    props?: readonly string[];
    properties?: Readonly<Record<string, PropertyContract>>;
    events?: Readonly<Record<string, EventContract>>;
    childrenMode?: ChildrenMode;
    registryNames?: readonly string[];
  } = {},
): FormComponentContract => {
  const properties = { ...baseProperties, ...(options.properties ?? {}) };
  const events = options.events ?? {};
  const props = options.props ?? Object.keys(properties);
  const completeProperties: Readonly<Record<string, PropertyContract>> = Object.fromEntries(
    [...new Set([...Object.keys(properties), ...props])].map((name) => [name, properties[name] ?? fallbackProperty(name)]),
  );
  return {
    component,
    registryNames: options.registryNames ?? [component],
    documentationSlug: component === 'row' || component === 'col'
      ? 'grid'
      : ['header', 'sider', 'content', 'footer'].includes(component)
        ? 'layout'
        : component,
    allowedProps: [...new Set(['id', 'component', ...props])],
    childrenMode: options.childrenMode ?? 'none',
    properties: completeProperties,
    eventNames: Object.keys(events),
    events,
    ...(options.dataModelBinding ? { dataModelBinding: options.dataModelBinding } : {}),
    ...(options.dependencies ? { dependencies: options.dependencies } : {}),
    ...(options.deprecated ? { deprecated: options.deprecated } : {}),
    ...(options.notes ? { notes: options.notes } : {}),
  };

};

const container = (component: string, props: readonly string[] = [], extra: Parameters<typeof contract>[1] = {}): FormComponentContract => contract(component, {
  ...extra,
  props: [...props, 'children'],
  childrenMode: extra.childrenMode ?? 'component-ids',
});

const field = (
  component: string,
  props: readonly string[],
  dataModelBinding: DataModelBindingContract,
  extra: Parameters<typeof contract>[1] = {},
): FormComponentContract => contract(component, {
  ...extra,
  props: [...props, 'value', 'field', 'rules', 'validateTrigger', 'on_change'],
  properties: {
    field: fieldProperty,
    rules: rulesProperty,
    value: valueProperty,
    on_change: { schema: schema(['object', 'array']) },
    ...(extra.properties ?? {}),
  },
  events: { on_change: onChangeEvent, ...(extra.events ?? {}) },
  dataModelBinding,
});

const contracts: FormComponentContract[] = [
  container('box', ['padding', 'layout', 'spacing', 'align', 'justify']),
  container('flex', ['vertical', 'wrap', 'gap', 'flex', 'align', 'justify']),
  container('grid', ['wrap', 'gutter', 'align', 'justify'], { registryNames: ['grid'] }),
  container('row', ['wrap', 'gutter', 'align', 'justify']),
  contract('col', {
    props: ['flex', 'span', 'offset', 'push', 'pull', 'order', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'children'],
    childrenMode: 'component-ids',
  }),
  container('space', ['direction', 'size', 'align', 'split', 'wrap']),
  container('layout', ['hasSider']),
  container('header'),
  container('sider', ['width', 'collapsible', 'collapsedWidth', 'reverseArrow', 'theme']),
  container('content'),
  container('footer'),
  contract('divider', { props: ['direction', 'align', 'content'], properties: { content: contentProperty } }),

  container('form', ['rules', 'submitButtonId', 'validateTrigger', 'layout']),
  field('input', ['placeholder', 'disabled'], { prop: 'value', valueTypes: ['string', 'null'] }, { properties: { placeholder: labelProperty, disabled: disabledProperty } }),
  field('textarea', ['placeholder', 'disabled', 'rows', 'maxLength'], { prop: 'value', valueTypes: ['string', 'null'] }, { properties: { placeholder: labelProperty, disabled: disabledProperty } }),
  field('select', ['placeholder', 'options', 'mode', 'disabled', 'allowClear', 'showSearch', 'maxTagCount'], { prop: 'value', valueTypes: ['string', 'number', 'boolean', 'array', 'null'] }, { properties: { placeholder: labelProperty, options: optionsProperty, disabled: disabledProperty, allowClear: { schema: booleanSchema, bindings: booleanBinding }, showSearch: { schema: booleanSchema, bindings: booleanBinding } } }),
  field('radio', ['options', 'disabled'], { prop: 'value', valueTypes: ['string', 'number', 'boolean', 'null'] }, { properties: { options: optionsProperty, disabled: disabledProperty } }),
  field('checkbox', ['options', 'label', 'disabled', 'checked'], { prop: 'checked', valueTypes: ['boolean', 'array'], variants: [{ when: { prop: 'options', present: true }, valueTypes: ['array'] }, { when: { prop: 'options', present: false }, valueTypes: ['boolean'] }] }, { properties: { options: optionsProperty, label: labelProperty, disabled: disabledProperty, checked: checkedProperty, value: { ...valueProperty, deprecated: { replacement: 'checked', reason: 'checkbox 的规范绑定属性为 checked。' } } }, deprecated: { value: { replacement: 'checked', reason: 'checkbox 的规范绑定属性为 checked。' } } }),
  field('datepicker', ['placeholder', 'picker', 'format', 'showTime', 'disabled', 'disabledDate'], { prop: 'value', valueTypes: ['string', 'null'] }, { properties: { placeholder: labelProperty, disabled: disabledProperty, showTime: { schema: booleanSchema, bindings: booleanBinding } } }),
  field('timepicker', ['format', 'placeholder', 'disabled', 'minuteStep', 'secondStep', 'hourStep'], { prop: 'value', valueTypes: ['string', 'null'] }, { properties: { placeholder: labelProperty, disabled: disabledProperty } }),
  field('upload', ['disabled', 'accept', 'multiple', 'maxCount', 'listType', 'showUploadList', 'label'], { prop: 'value', valueTypes: ['array', 'null'] }, { childrenMode: 'button-trigger', properties: { disabled: disabledProperty, label: labelProperty } }),
  field('switch', ['checkedChildren', 'unCheckedChildren', 'checked', 'disabled', 'size'], { prop: 'checked', valueTypes: ['boolean'] }, { properties: { checked: checkedProperty, disabled: disabledProperty, value: { ...valueProperty, deprecated: { replacement: 'checked', reason: 'switch 的规范绑定属性为 checked。' } } }, deprecated: { value: { replacement: 'checked', reason: 'switch 的规范绑定属性为 checked。' } } }),
  field('inputnumber', ['min', 'max', 'step', 'precision', 'disabled'], { prop: 'value', valueTypes: ['number', 'null'] }, { properties: { disabled: disabledProperty } }),
  field('slider', ['min', 'max', 'step', 'range', 'disabled'], { prop: 'value', valueTypes: ['number', 'array', 'null'] }, { properties: { disabled: disabledProperty } }),
  field('rate', ['disabled', 'allowHalf', 'count'], { prop: 'value', valueTypes: ['number', 'null'] }, { properties: { disabled: disabledProperty } }),
  field('cascader', ['options', 'disabled'], { prop: 'value', valueTypes: ['array', 'string', 'number', 'null'] }, { properties: { options: optionsProperty, disabled: disabledProperty } }),
  field('treeselect', ['options', 'multiple', 'placeholder', 'disabled'], { prop: 'value', valueTypes: ['string', 'number', 'array', 'null'] }, { properties: { options: optionsProperty, placeholder: labelProperty, disabled: disabledProperty } }),
  field('colorpicker', ['disabled'], { prop: 'value', valueTypes: ['string', 'null'] }, { properties: { disabled: disabledProperty } }),
  field('transfer', ['disabled', 'data'], { prop: 'data', valueTypes: ['array', 'null'] }, { properties: { disabled: disabledProperty, data: dataProperty } }),
  field('autocomplete', ['placeholder', 'options', 'disabled'], { prop: 'value', valueTypes: ['string', 'null'] }, { properties: { placeholder: labelProperty, options: optionsProperty, disabled: disabledProperty } }),
  field('mentions', ['options', 'prefix', 'disabled'], { prop: 'value', valueTypes: ['string', 'null'] }, { properties: { options: optionsProperty, disabled: disabledProperty } }),
  contract('button', { props: ['label', 'title', 'color', 'content', 'disabled', 'type', 'danger', 'ghost', 'shape', 'size', 'block', 'children', 'on_tap'], childrenMode: 'component-ids', properties: { label: labelProperty, content: contentProperty, disabled: disabledProperty, on_tap: { schema: schema(['object', 'array']) } }, events: { on_tap: { description: '按钮点击时执行。' } } }),
  field('calendar', ['fullscreen', 'mode', 'disabled', 'format'], { prop: 'value', valueTypes: ['string', 'null'] }, { properties: { disabled: disabledProperty, fullscreen: { schema: booleanSchema, bindings: booleanBinding } }, events: { on_panel_change: { description: '面板月份或年份变化时执行。' } } }),
  field('segmented', ['options', 'block', 'disabled', 'size'], { prop: 'value', valueTypes: ['string', 'number', 'boolean', 'null'] }, { properties: { options: optionsProperty, disabled: disabledProperty, block: { schema: booleanSchema, bindings: booleanBinding } } }),

  contract('text', { props: ['content', 'color', 'title'], properties: { content: contentProperty, title: labelProperty } }),
  contract('icon', { props: ['icon', 'spin', 'rotate'], properties: { icon: labelProperty, spin: { schema: booleanSchema, bindings: booleanBinding } } }),
  container('typography', ['variant', 'textType', 'type', 'level', 'disabled', 'mark', 'code', 'keyboard', 'underline', 'delete', 'strong', 'italic', 'ellipsis', 'copyable', 'href', 'target', 'items']),
  contract('alert', { props: ['title', 'content', 'message', 'description', 'showIcon', 'status', 'type', 'closable', 'on_close'], properties: { title: contentProperty, content: contentProperty, message: { schema: stringSchema, deprecated: { replacement: 'title', reason: '运行时规范主提示属性为 title 或 content。' } }, description: contentProperty, showIcon: { schema: booleanSchema, bindings: booleanBinding } } }),
  contract('tag', { props: ['content', 'color', 'bordered'], properties: { content: contentProperty, bordered: { schema: booleanSchema, bindings: booleanBinding } } }),
  container('spin', ['spinning', 'tip', 'size'], { properties: { spinning: { schema: booleanSchema, bindings: booleanBinding }, tip: contentProperty } }),
  container('skeleton', ['loading', 'visible', 'active', 'avatar', 'paragraph', 'round', 'title', 'skeletonType', 'shape', 'block', 'size'], { properties: { loading: { schema: booleanSchema, bindings: booleanBinding, default: true }, visible: { schema: booleanSchema, bindings: booleanBinding, deprecated: { replacement: 'loading', reason: '历史 visible 表示 loading；整体显隐应使用外层 box.visible。' } } }, deprecated: { visible: { replacement: 'loading', reason: '历史 visible 表示 loading；整体显隐应使用外层 box.visible。' } }, dependencies: [{ when: 'skeletonType', forbids: ['children', 'loading', 'visible'], message: '独立骨架形态不渲染 children，不能配置 loading。' }] }),
  contract('progress', { props: ['percent', 'status', 'size'] }),
  container('modal', ['open', 'title', 'cancelText', 'okText', 'okType', 'footer', 'width', 'centered', 'closable', 'destroyOnHidden', 'keyboard', 'mask', 'maskClosable', 'zIndex', 'on_ok', 'on_cancel'], { properties: { open: { schema: booleanSchema, bindings: { accepts: ['boolean', 'path'], pathScope: 'root-or-repeater-relative' } } }, events: { on_ok: { description: '确认按钮动作。' }, on_cancel: { description: '取消或关闭动作。' } } }),
  container('drawer', ['open', 'title', 'placement', 'width', 'height', 'closable', 'destroyOnHidden', 'keyboard', 'mask', 'maskClosable', 'zIndex', 'extra', 'footer', 'on_close'], { properties: { open: { schema: booleanSchema, bindings: { accepts: ['boolean', 'path'], pathScope: 'root-or-repeater-relative' } } }, events: { on_close: { description: '抽屉关闭动作。' } } }),
  contract('tooltip', { props: ['title', 'placement', 'trigger', 'open', 'on_open_change', 'arrow', 'color', 'children'], childrenMode: 'trigger-component-ids', properties: { title: contentProperty, open: { schema: booleanSchema, bindings: { accepts: ['boolean', 'expression', 'path'], pathScope: 'root-or-repeater-relative', expressionMode: 'pure' } } }, events: { on_open_change: { description: '受控开关变化动作。' } } }),
  contract('popover', { props: ['title', 'content', 'placement', 'trigger', 'open', 'on_open_change', 'arrow', 'children'], childrenMode: 'trigger-component-ids', properties: { title: contentProperty, content: contentProperty, open: { schema: booleanSchema, bindings: { accepts: ['boolean', 'path'], pathScope: 'root-or-repeater-relative' } } }, events: { on_open_change: { description: '受控开关变化动作。' } } }),
  contract('popconfirm', { props: ['title', 'description', 'okText', 'cancelText', 'okType', 'placement', 'disabled', 'on_confirm', 'on_cancel', 'children'], childrenMode: 'trigger-component-ids', properties: { title: contentProperty, description: contentProperty, disabled: disabledProperty }, events: { on_confirm: { description: '确认动作。' }, on_cancel: { description: '取消动作。' } } }),
  contract('condition', { props: ['when', 'then', 'else', 'match', 'cases', 'default'], childrenMode: 'branch-component-ids', properties: { when: { schema: booleanSchema, bindings: booleanBinding, description: '判断模式条件。' }, match: { schema: schema(['string', 'number', 'boolean', 'null']), bindings: { accepts: ['expression', 'path'], pathScope: 'root-or-repeater-relative', expressionMode: 'pure' }, description: '匹配模式表达式或静态值。' }, then: { schema: schema('array', { items: stringSchema }) }, else: { schema: schema('array', { items: stringSchema }) }, cases: { schema: schema('object', { additionalProperties: schema('array', { items: stringSchema }) }) }, default: { schema: schema('array', { items: stringSchema }) } }, dependencies: [{ requires: 'then', when: 'when', forbids: ['match', 'cases'], message: 'when 模式需要 then，且不能与 match 模式混用。' }, { requires: 'cases', when: 'match', forbids: ['when', 'then', 'else'], message: 'match 模式需要 cases，且不能与 when 模式混用。' }, { when: 'else', forbids: ['default'], message: 'when 模式的 else 与 default 最多选择一个。' }, { when: 'default', forbids: ['else'], message: 'when 模式的 else 与 default 最多选择一个。' }] }),
  container('repeater', ['data', 'direction', 'gap', 'emptyContent', 'keyField'], { childrenMode: 'template-component-ids', properties: { data: rootDataProperty, emptyContent: contentProperty }, dataModelBinding: { prop: 'data', valueTypes: ['array'] }, notes: ['data.path 使用根路径；模板子组件的可回写绑定可使用 ./field。'] }),
];

export const formComponentContractVersion = 1 as const;

/** Contracts indexed by every Form Registry name. */
export const formComponentContracts: Readonly<Record<string, FormComponentContract>> = Object.fromEntries(
  contracts.flatMap((item) => item.registryNames.map((name) => [name, { ...item, component: name, registryNames: [name], documentationSlug: item.documentationSlug }] as const)),
);

export const formSchemaContract = {
  edition: 'form',
  activity: {
    type: 'ACTIVITY_SNAPSHOT',
    content: {
      required: ['components', 'dataModel'],
      components: { type: 'array', itemRef: 'formComponentContracts' },
      dataModel: { type: 'object' },
    },
  },
  componentGraph: {
    rootId: 'root',
    componentsAreFlat: true,
    idsUnique: true,
    eachComponentReferencedOnce: true,
    acyclic: true,
    branchReferences: ['then', 'else', 'cases', 'default'],
    repeaterTemplateReferences: 'children belong to repeater and repeat per data item',
  },
  paths: {
    bindingObject: { exactKeys: ['path'], nonEmpty: true },
    root: { prefix: '/', description: 'JSON data model root path.' },
    repeaterRelative: { prefix: './', allowedOnlyIn: ['repeater.children'] },
    forbidden: ['/', './'],
    pointerEscapes: { supportedByRuntime: true, generationRecommendation: 'avoid field names containing / or ~' },
    expressionCannotContainPathObject: true,
  },
  expressions: {
    pureContexts: ['$root', '$current', '$parent'],
    actionContexts: ['$root', '$current', '$parent', '$value'],
    recommended: ['${$root.field}', '${!$root.field}', "${$root.status === 'approved'}", '${$current.enabled}'],
    forbiddenRecommendations: ['${field}', '${value}', '${fileList}', '{ not: ... }'],
  },
  condition: {
    modes: {
      when: { required: ['when', 'then'], optional: ['else', 'default'], mutuallyExclusive: ['match', 'cases'] },
      match: { required: ['match', 'cases'], optional: ['default'], mutuallyExclusive: ['when', 'then', 'else'] },
    },
    matchKeyTypes: ['string', 'number', 'boolean', 'null'],
  },
  events: {
    onChange: { automaticWriteback: 'only-when-event-absent', valueContext: '$value', strictMode: 'warning' },
  },
  skeleton: {
    loadingDefault: true,
    loadingProperty: 'loading',
    deprecatedAlias: 'visible',
    visibilityWrapper: 'box.visible',
  },
  strictMode: {
    unknownProps: 'error',
    invalidBindings: 'error',
    onChangeWritebackConflict: 'warning',
    runtimeRemainsBackwardCompatible: true,
  },
} as const;

/**
 * FAUI JSON Validator - validates generated schemas against FAUI rules.
 *
 * The default mode intentionally retains the historical, warning-oriented
 * checks in this file. Form Edition consumers can opt into the published
 * static contract with:
 *
 *   node scripts/validate-schema.cjs --mode=form-strict schema.json
 *
 * `--contract <file>` is useful while developing a contract locally. The
 * published package normally supplies the contract from its manifest export.
 */

const fs = require('fs');
const path = require('path');

const VALID_COMPONENTS = [
  'box', 'flex', 'row', 'col', 'space', 'layout', 'header', 'sider', 'content', 'footer',
  'form', 'card', 'divider', 'menu', 'tabs', 'steps', 'pagination', 'anchor', 'dropdown',
  'affix', 'float_button', 'text', 'typography', 'icon', 'button', 'table', 'list', 'tree',
  'carousel', 'calendar', 'segmented', 'avatar', 'badge', 'empty', 'statistic', 'timeline',
  'qrcode', 'watermark', 'skeleton', 'collapse', 'tag', 'image', 'descriptions', 'stepindicator',
  'progress', 'input', 'textarea', 'inputnumber', 'select', 'radio', 'checkbox', 'datepicker',
  'timepicker', 'upload', 'switch', 'slider', 'rate', 'cascader', 'treeselect', 'transfer',
  'autocomplete', 'colorpicker', 'mentions', 'modal', 'drawer', 'popover', 'tooltip',
  'popconfirm', 'tour', 'alert', 'spin', 'grid', 'condition', 'repeater'
];

const VALID_ACTIONS = [
  'update_data', 'http_proxy', 'message', 'notification',
  'copy', 'mcp_tool_call', 'send_prompt', 'input_prompt'
];

function isPathBinding(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && typeof value.path === 'string');
}

function isPureExpression(value) {
  return typeof value === 'string' && /^\$\{[\s\S]*\}$/.test(value.trim());
}

function hasExpression(value) {
  return typeof value === 'string' && /\$\{[\s\S]*\}/.test(value);
}

function normalizeContract(raw) {
  if (!raw) return null;
  const contract = raw.formComponentContracts || raw.components || raw.default || raw;
  if (!contract) return null;

  if (Array.isArray(contract)) {
    return Object.fromEntries(contract.map((item) => {
      const names = item.registryNames || item.registryName || item.component || item.name;
      const list = Array.isArray(names) ? names : [names];
      return list.filter(Boolean).map((name) => [name, item]);
    }).flat());
  }
  if (typeof contract === 'object') return contract;
  return null;
}

function loadContract(explicitPath) {
  const candidates = explicitPath ? [explicitPath] : [
    path.join(process.cwd(), 'src', 'formComponentContracts.ts'),
    path.join(process.cwd(), 'src', 'formComponentContracts.json'),
    path.join(process.cwd(), 'src', 'formComponentContracts.cjs'),
    path.join(process.cwd(), 'dist', 'manifest.js'),
    path.join(process.cwd(), 'dist', 'manifest.cjs'),
  ];

  for (const candidate of candidates) {
    if (!candidate || !fs.existsSync(candidate)) continue;
    try {
      if (candidate.endsWith('.json')) return normalizeContract(JSON.parse(fs.readFileSync(candidate, 'utf8')));
      // eslint-disable-next-line global-require, import/no-dynamic-require
      if (!candidate.endsWith('.ts')) return normalizeContract(require(candidate));

      // The contract is intentionally a static TS module. Transpile it in
      // memory so strict validation works from a source checkout without a
      // build step or generated dist files.
      // eslint-disable-next-line global-require
      const typescript = require('typescript');
      const Module = require('module');
      const loaded = new Module(candidate, module);
      loaded.filename = candidate;
      loaded.paths = Module._nodeModulePaths(path.dirname(candidate));
      const output = typescript.transpileModule(fs.readFileSync(candidate, 'utf8'), {
        compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020 },
        fileName: candidate,
      }).outputText;
      loaded._compile(output, candidate);
      return normalizeContract(loaded.exports);
    } catch (error) {
      if (explicitPath) throw new Error(`Unable to load contract ${candidate}: ${error.message}`);
    }
  }
  return null;
}

function getAllowedProps(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const props = new Set(Array.isArray(entry.allowedProps) ? entry.allowedProps : []);
  if (entry.properties && typeof entry.properties === 'object') {
    Object.keys(entry.properties).forEach((property) => props.add(property));
  }
  if (props.size > 0) return props;
  return null;
}

function getBindingSpec(entry, prop) {
  if (!entry || typeof entry !== 'object') return null;
  const source = entry.bindings && entry.bindings[prop]
    ? entry.bindings[prop]
    : entry.properties && entry.properties[prop] && entry.properties[prop].bindings;
  if (!source) return null;
  if (Array.isArray(source)) return { accepts: source };
  if (typeof source === 'string') {
    return { accepts: source.split('|').map((item) => item.trim()).filter(Boolean) };
  }
  if (typeof source === 'object') return { ...source, accepts: Array.isArray(source.accepts) ? source.accepts : [] };
  return null;
}

function getBindingProps(entry) {
  if (!entry || typeof entry !== 'object') return [];
  if (entry.bindings && typeof entry.bindings === 'object') return Object.keys(entry.bindings);
  if (entry.properties && typeof entry.properties === 'object') {
    return Object.keys(entry.properties).filter((key) => entry.properties[key] && entry.properties[key].bindings);
  }
  return [];
}

function valueMatchesType(value, type) {
  if (type === 'unknown') return true;
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === type;
}

function valueMatchesAnyType(value, types) {
  return Array.isArray(types) && types.some((type) => valueMatchesType(value, type));
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function validateChildrenMode(component, entry, componentMap, errors) {
  // External contracts created during migration may omit childrenMode. Only
  // enforce this rule when the contract explicitly declares a mode.
  if (!entry.childrenMode) return;
  const mode = entry.childrenMode;
  const children = component.children;
  if (mode === 'branch-component-ids') {
    if (hasOwn(component, 'children')) {
      errors.push(`[${component.id || '?'}] condition uses branch fields and cannot define children`);
    }
    return;
  }
  if (mode === 'none') {
    if (hasOwn(component, 'children')) {
      errors.push(`[${component.id || '?'}] children are not allowed for ${component.component}`);
    }
    return;
  }

  if (!Array.isArray(children)) {
    errors.push(`[${component.id || '?'}] children must be an array of component IDs`);
    return;
  }

  if (mode === 'button-trigger') {
    if (children.length > 1) {
      errors.push(`[${component.id || '?'}] upload allows at most one button child`);
    }
    for (const childId of children) {
      if (componentMap.get(childId)?.component !== 'button') {
        errors.push(`[${component.id || '?'}] upload children must reference button components`);
      }
    }
  }

}

function validateDependencies(component, entry, errors) {
  for (const dependency of entry.dependencies || []) {
    if (!dependency || typeof dependency !== 'object') continue;
    if (dependency.when && !hasOwn(component, dependency.when)) continue;
    if (dependency.requires && !hasOwn(component, dependency.requires)) {
      errors.push(`[${component.id || '?'}] ${component.component} requires "${dependency.requires}" when "${dependency.when}" is present`);
    }
    if (Array.isArray(dependency.requiresOneOf)
      && !dependency.requiresOneOf.some((property) => hasOwn(component, property))) {
      errors.push(`[${component.id || '?'}] ${component.component} requires one of: ${dependency.requiresOneOf.join(', ')}`);
    }
    for (const property of dependency.forbids || []) {
      if (hasOwn(component, property)) {
        errors.push(`[${component.id || '?'}] ${component.component} cannot combine "${dependency.when}" with "${property}"`);
      }
    }
  }
}

function validateFormStrict(schema, contract, errors, warnings) {
  if (!contract) {
    errors.push('Form contract is unavailable; build or provide it with --contract <file>');
    return;
  }

  if (!Array.isArray(schema) || !schema[0] || !schema[0].content) return;
  const components = schema[0].content.components;
  const dataModel = schema[0].content.dataModel;
  if (!Array.isArray(components)) {
    errors.push('Form content.components must be an array');
    return;
  }
  if (!dataModel || typeof dataModel !== 'object' || Array.isArray(dataModel)) {
    errors.push('Form content.dataModel must be an object');
    return;
  }
  const entries = contract.formComponentContracts || contract.components || contract;
  const contractNames = new Set(Object.keys(entries || {}));
  const componentMap = new Map(components.map((component) => [component.id, component]));

  // Build parent links for the strict tree checks and Repeater relative paths.
  const parents = new Map();
  const references = [];
  const addReferences = (owner, ids) => {
    if (!Array.isArray(ids)) return;
    for (const childId of ids) {
      references.push({ owner, childId });
      if (!parents.has(childId)) parents.set(childId, []);
      parents.get(childId).push(owner.id);
    }
  };
  for (const component of components) {
    addReferences(component, component.children);
    if (component.component === 'condition') {
      for (const branch of ['then', 'else', 'default']) {
        if (hasOwn(component, branch) && !Array.isArray(component[branch])) {
          errors.push(`[${component.id || '?'}] condition ${branch} must be an array of component IDs`);
        }
      }
      if (hasOwn(component, 'cases') && (!component.cases || typeof component.cases !== 'object' || Array.isArray(component.cases))) {
        errors.push(`[${component.id || '?'}] condition cases must be an object of component ID arrays`);
      }
      addReferences(component, component.then);
      addReferences(component, component.else);
      addReferences(component, component.default);
      if (component.cases && typeof component.cases === 'object') {
        Object.entries(component.cases).forEach(([key, ids]) => {
          if (!Array.isArray(ids)) {
            errors.push(`[${component.id || '?'}] condition cases[${key}] must be an array of component IDs`);
          }
          addReferences(component, ids);
        });
      }
    }
  }
  for (const { owner, childId } of references) {
    if (!componentMap.has(childId)) {
      errors.push(`[${owner.id || '?'}] references non-existent component "${childId}"`);
    }
  }

  const ancestorHasRepeater = (id) => {
    const seen = new Set();
    const visit = (current) => {
      if (seen.has(current)) return false;
      seen.add(current);
      const component = componentMap.get(current);
      if (component && component.component === 'repeater') return true;
      return (parents.get(current) || []).some(visit);
    };
    return visit(id);
  };

  for (const component of components) {
    const prefix = `[${component.id || '?'}]`;
    const entry = entries[component.component];
    if (!entry || !contractNames.has(component.component)) {
      errors.push(`${prefix} Component "${component.component}" is not allowed in Form Edition`);
      continue;
    }

    const allowed = getAllowedProps(entry);
    if (allowed) {
      for (const key of Object.keys(component)) {
        if (!allowed.has(key)) errors.push(`${prefix} Property "${key}" is not declared by the Form contract`);
      }
    }

    validateChildrenMode(component, entry, componentMap, errors);
    validateDependencies(component, entry, errors);

    if (component.component === 'condition') {
      const hasWhen = hasOwn(component, 'when');
      const hasMatch = hasOwn(component, 'match');
      if (!hasWhen && !hasMatch) {
        errors.push(`${prefix} condition must use either when or match mode`);
      } else if (hasWhen) {
        if (!hasOwn(component, 'then')) errors.push(`${prefix} condition when mode requires "then"`);
        if (hasMatch || hasOwn(component, 'cases')) errors.push(`${prefix} condition when mode cannot use match/cases`);
        if (hasOwn(component, 'else') && hasOwn(component, 'default')) {
          errors.push(`${prefix} condition when mode cannot use both else and default`);
        }
      } else if (!hasOwn(component, 'cases')) {
        errors.push(`${prefix} condition match mode requires "cases"`);
      }
    }

    const bindingProps = getBindingProps(entry);
    for (const prop of bindingProps) {
      if (!(prop in component)) continue;
      const value = component[prop];
      const spec = getBindingSpec(entry, prop);
      const accepts = new Set(spec ? spec.accepts : []);
      if (isPathBinding(value)) {
        if (Object.keys(value).length !== 1 || value.path.length === 0) {
          errors.push(`${prefix} ${prop} path binding must be exactly { path: "/field" }`);
        } else if (!(value.path.startsWith('/') || value.path.startsWith('./')) || value.path === '/' || value.path === './') {
          errors.push(`${prefix} ${prop}.path must be a non-empty root or Repeater-relative path`);
        } else if (!accepts.has('path')) {
          errors.push(`${prefix} ${prop} does not support path bindings`);
        } else if (value.path.startsWith('./') && spec && spec.pathScope === 'root') {
          errors.push(`${prefix} ${prop}.path must use a root path`);
        } else if (value.path.startsWith('./') && !ancestorHasRepeater(component.id)) {
          errors.push(`${prefix} ${prop}.path uses "./" outside a Repeater template`);
        }
      } else if (hasExpression(value)) {
        if (!isPureExpression(value)) {
          if (accepts.has('expression') && spec && spec.expressionMode === 'pure') {
            errors.push(`${prefix} ${prop} only accepts a pure expression`);
          }
        } else if (!accepts.has('expression')) {
          errors.push(`${prefix} ${prop} does not support expressions`);
        }
      } else if (value !== null && typeof value === 'object') {
        errors.push(`${prefix} ${prop} dynamic value must be a { path } binding or an allowed expression`);
      } else if (accepts.has('path') && accepts.size === 1) {
        errors.push(`${prefix} ${prop} only accepts a { path } binding`);
      } else if (accepts.has('boolean') && accepts.has('expression')
        && typeof value === 'string' && !isPureExpression(value)) {
        errors.push(`${prefix} ${prop} must be a boolean or a pure expression`);
      }
    }

    // A value binding and on_change are retained for compatibility, but are
    // warned about in strict mode until an after-change event exists.
    if (component.on_change && (isPathBinding(component.value) || isPathBinding(component.checked))) {
      warnings.push(`${prefix} on_change currently overrides automatic value writeback; prefer a future on_after_change event`);
    }
  }

  // Strict Form schemas must initialise every root-bound path.
  const getByPointer = (object, pointer) => {
    const parts = pointer.split('/').filter(Boolean);
    let current = object;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  };
  for (const component of components) {
    const entry = entries[component.component];
    for (const prop of getBindingProps(entry)) {
      const value = component[prop];
      if (!isPathBinding(value) || !value.path.startsWith('/')) continue;
      const modelValue = getByPointer(dataModel, value.path);
      if (modelValue === undefined) {
        errors.push(`[${component.id || '?'}] dataModel must initialise bound path "${value.path}"`);
        continue;
      }
      const modelBinding = entry.dataModelBinding;
      if (modelBinding && modelBinding.prop === prop && !valueMatchesAnyType(modelValue, modelBinding.valueTypes)) {
        errors.push(`[${component.id || '?'}] dataModel path "${value.path}" has an invalid initial value type for ${prop}`);
      }
    }
  }

  // Enforce the documented single-root tree in strict mode. Repeater and
  // Condition branch references are included above.
  if (componentMap.has('root')) {
    if ((parents.get('root') || []).length > 0) {
      errors.push('[root] root component must not be referenced by another component');
    }
    for (const component of components) {
      if (component.id === 'root') continue;
      const count = (parents.get(component.id) || []).length;
      if (count !== 1) errors.push(`[${component.id}] must be referenced by exactly one parent (found ${count})`);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const walk = (id) => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const component = componentMap.get(id);
    const children = references.filter((reference) => reference.owner.id === id).map((reference) => reference.childId);
    const cycle = children.some((childId) => walk(childId));
    visiting.delete(id);
    visited.add(id);
    return cycle;
  };
  for (const component of components) {
    if (walk(component.id)) {
      errors.push('Component reference graph contains a cycle');
      break;
    }
  }
}

function validate(schema, options = {}) {
  const errors = [];
  const warnings = [];

  // Rule 1: Must be array
  if (!Array.isArray(schema)) {
    errors.push('Schema must be an array');
    return { errors, warnings };
  }

  // Rule 2: First element must be ACTIVITY_SNAPSHOT
  if (schema.length === 0 || schema[0].type !== 'ACTIVITY_SNAPSHOT') {
    errors.push('First element must be ACTIVITY_SNAPSHOT');
    return { errors, warnings };
  }

  const snapshot = schema[0];
  if (!snapshot.content || !Array.isArray(snapshot.content.components) || snapshot.content.dataModel === undefined) {
    errors.push('ACTIVITY_SNAPSHOT must have content.components and content.dataModel');
    return { errors, warnings };
  }

  const components = snapshot.content.components;
  const dataModel = snapshot.content.dataModel;

  // Build component map
  const componentMap = new Map();
  const idSet = new Set();

  for (const comp of components) {
    if (!comp.id) {
      errors.push('Component missing id: ' + JSON.stringify(comp).substring(0, 100));
      continue;
    }
    if (idSet.has(comp.id)) {
      errors.push(`Duplicate component id: "${comp.id}"`);
    }
    idSet.add(comp.id);
    componentMap.set(comp.id, comp);
  }

  // Rule 3: Must have root
  if (!componentMap.has('root')) {
    errors.push('Missing root component (id: "root")');
  }

  // Validate each component
  for (const comp of components) {
    const prefix = `[${comp.id}]`;

    // Rule 4: Component name must be lowercase
    if (!comp.component) {
      errors.push(`${prefix} Missing "component" field`);
      continue;
    }
    if (comp.component !== comp.component.toLowerCase()) {
      errors.push(`${prefix} Component name must be lowercase: "${comp.component}" → "${comp.component.toLowerCase()}"`);
    }
    if (!VALID_COMPONENTS.includes(comp.component)) {
      warnings.push(`${prefix} Unknown component type: "${comp.component}"`);
    }

    // Rule 5: Children must reference existing IDs
    if (comp.children) {
      for (const childId of comp.children) {
        if (!idSet.has(childId)) {
          errors.push(`${prefix} children references non-existent id: "${childId}"`);
        }
      }
    }

    // Rule 6: Button must use on_tap (array)
    if (comp.component === 'button') {
      if (comp.on_click) {
        errors.push(`${prefix} Button must use "on_tap", not "on_click"`);
      }
      if (comp.on_tap && !Array.isArray(comp.on_tap)) {
        errors.push(`${prefix} on_tap must be an array`);
      }
      if (!comp.label && !comp.content && !comp.children) {
        warnings.push(`${prefix} Button has no label, content, or children`);
      }
    }

    // Rule 7: text must use content
    if (comp.component === 'text') {
      if (comp.value && typeof comp.value === 'object' && comp.value.path && !comp.content) {
        warnings.push(`${prefix} text component should use "content" not "value" for display`);
      }
    }

    // Rule 8: form must have submitButtonId
    if (comp.component === 'form') {
      if (!comp.submitButtonId) {
        warnings.push(`${prefix} form should have submitButtonId`);
      }
      if (comp.rules && comp.rules.length > 0) {
        errors.push(`${prefix} rules must not be on form, put them on field components`);
      }
    }

    // Rule 9: table must have rowKey and data
    if (comp.component === 'table') {
      if (!comp.rowKey) {
        errors.push(`${prefix} table must have rowKey`);
      }
      if (!comp.data || !comp.data.path) {
        errors.push(`${prefix} table must have data: { path: "/xxx" }`);
      }
    }

    // Rule 10: modal must use open, not visible
    if (comp.component === 'modal' || comp.component === 'drawer') {
      if (comp.visible !== undefined && comp.open === undefined) {
        errors.push(`${prefix} ${comp.component} must use "open", not "visible"`);
      }
    }

    // Rule 11: descriptions must use options
    if (comp.component === 'descriptions') {
      if (comp.items && !comp.options) {
        errors.push(`${prefix} descriptions must use "options", not "items"`);
      }
    }

    // Rule 12: select/radio must have options
    if (['select', 'radio'].includes(comp.component)) {
      if (!comp.options || (Array.isArray(comp.options) && comp.options.length === 0)) {
        errors.push(`${prefix} ${comp.component} must have options array`);
      }
    }

    // Rule 13: Validate value bindings
    if (comp.value && typeof comp.value === 'object' && comp.value.path) {
      if (!comp.value.path.startsWith('/') && !comp.value.path.startsWith('./')) {
        errors.push(`${prefix} value.path must start with "/" or "./" (in list context): "${comp.value.path}"`);
      }
    }

    // Rule 14: Validate actions
    const actionFields = ['on_tap', 'on_change', 'on_ok', 'on_cancel', 'on_close', 'on_click',
                          'on_confirm', 'on_menu_click', 'on_select', 'on_open_change'];
    for (const field of actionFields) {
      if (comp[field]) {
        const actions = Array.isArray(comp[field]) ? comp[field] : [comp[field]];
        for (const action of actions) {
          if (action.action && !VALID_ACTIONS.includes(action.action)) {
            warnings.push(`${prefix} Unknown action type: "${action.action}"`);
          }
          if (action.action === 'update_data') {
            if (action.payload && (action.payload.path || action.payload.value)) {
              errors.push(`${prefix} update_data: path/value must be at top level, not in payload`);
            }
          }
          if (action.action === 'http_proxy') {
            if (!action.payload || !action.payload.http_config) {
              errors.push(`${prefix} http_proxy must have payload.http_config`);
            }
          }
        }
      }
    }
  }

  // Rule 15: Check dataModel completeness
  function findAllPaths(components) {
    const paths = new Set();
    for (const comp of components) {
      if (comp.value && typeof comp.value === 'object' && comp.value.path) {
        if (comp.value.path.startsWith('/')) paths.add(comp.value.path);
      }
      if (comp.checked && typeof comp.checked === 'object' && comp.checked.path) {
        if (comp.checked.path.startsWith('/')) paths.add(comp.checked.path);
      }
      if (comp.data && typeof comp.data === 'object' && comp.data.path) {
        if (comp.data.path.startsWith('/')) paths.add(comp.data.path);
      }
      if (comp.open && typeof comp.open === 'object' && comp.open.path) {
        if (comp.open.path.startsWith('/')) paths.add(comp.open.path);
      }
      if (comp.selectedKeys && typeof comp.selectedKeys === 'object' && comp.selectedKeys.path) {
        if (comp.selectedKeys.path.startsWith('/')) paths.add(comp.selectedKeys.path);
      }
      if (comp.current && typeof comp.current === 'object' && comp.current.path) {
        if (comp.current.path.startsWith('/')) paths.add(comp.current.path);
      }
      if (comp.activeKey && typeof comp.activeKey === 'object' && comp.activeKey.path) {
        if (comp.activeKey.path.startsWith('/')) paths.add(comp.activeKey.path);
      }
    }
    return paths;
  }

  function getByPointer(obj, pointer) {
    const parts = pointer.split('/').filter(Boolean);
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  const boundPaths = findAllPaths(components);
  for (const p of boundPaths) {
    const val = getByPointer(dataModel, p);
    if (val === undefined) {
      warnings.push(`dataModel missing initial value for bound path: "${p}"`);
    }
  }

  // Validate ACTIVITY_DELTA entries
  for (let i = 1; i < schema.length; i++) {
    const entry = schema[i];
    if (entry.type === 'ACTIVITY_DELTA') {
      if (!Array.isArray(entry.patch)) {
        errors.push(`Delta entry [${i}] must have "patch" array`);
      } else {
        for (const op of entry.patch) {
          if (!['add', 'remove', 'replace', 'move', 'copy', 'test'].includes(op.op)) {
            errors.push(`Delta entry [${i}] invalid op: "${op.op}"`);
          }
        }
      }
    }
  }

  if (options.mode === 'form-strict') validateFormStrict(schema, options.contract, errors, warnings);

  return { errors, warnings };
}

// Main
const args = process.argv.slice(2);
let mode = 'compat';
let contractPath;
let target;
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--mode') {
    mode = args[index + 1] || mode;
    index += 1;
  } else if (arg.startsWith('--mode=')) {
    mode = arg.slice('--mode='.length);
  } else if (arg === '--contract') {
    contractPath = args[index + 1];
    index += 1;
  } else if (arg.startsWith('--contract=')) {
    contractPath = arg.slice('--contract='.length);
  } else if (!arg.startsWith('-') && !target) {
    target = arg;
  }
}

if (!['compat', 'form-strict'].includes(mode)) {
  console.error(`Unknown validation mode: ${mode}`);
  process.exit(1);
}

if (!target) {
  console.log('Usage: node scripts/validate-schema.cjs [--mode=compat|form-strict] [--contract <file>] <json-file-or-dir>');
  process.exit(0);
}

const stat = fs.statSync(target);
const files = stat.isDirectory()
  ? fs.readdirSync(target).filter(f => f.endsWith('.json')).map(f => path.join(target, f))
  : [target];

let totalErrors = 0;
let totalWarnings = 0;
let contract;
if (mode === 'form-strict') {
  try {
    contract = loadContract(contractPath);
  } catch (error) {
    console.error(`Unable to load Form contract: ${error.message}`);
    process.exit(1);
  }
}

for (const file of files) {
  const name = path.basename(file);
  try {
    const content = fs.readFileSync(file, 'utf8');
    const schema = JSON.parse(content);
    const { errors, warnings } = validate(schema, { mode, contract });

    const icon = errors.length === 0 ? '✓' : '✗';
    console.log(`\n${icon} ${name}`);

    for (const e of errors) {
      console.log(`  ERROR: ${e}`);
      totalErrors++;
    }
    for (const w of warnings) {
      console.log(`  WARN:  ${w}`);
      totalWarnings++;
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('  All checks passed!');
    }
  } catch (e) {
    console.log(`\n✗ ${name}`);
    console.log(`  PARSE ERROR: ${e.message}`);
    totalErrors++;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Total: ${files.length} files, ${totalErrors} errors, ${totalWarnings} warnings`);
process.exit(totalErrors > 0 ? 1 : 0);

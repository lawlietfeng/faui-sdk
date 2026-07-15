/**
 * FAUI JSON Validator - validates generated schemas against FAUI rules
 * Run: node scripts/validate-schema.cjs <json-file-or-dir>
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
  'popconfirm', 'tour', 'alert', 'spin', 'grid'
];

const VALID_ACTIONS = [
  'update_data', 'http_proxy', 'message', 'notification',
  'copy', 'mcp_tool_call', 'send_prompt', 'input_prompt'
];

function validate(schema) {
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
  if (!snapshot.content || !snapshot.content.components || !snapshot.content.dataModel === undefined) {
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

  return { errors, warnings };
}

// Main
const target = process.argv[2];
if (!target) {
  console.log('Usage: node scripts/validate-schema.cjs <json-file-or-dir>');
  process.exit(0);
}

const stat = fs.statSync(target);
const files = stat.isDirectory()
  ? fs.readdirSync(target).filter(f => f.endsWith('.json')).map(f => path.join(target, f))
  : [target];

let totalErrors = 0;
let totalWarnings = 0;

for (const file of files) {
  const name = path.basename(file);
  try {
    const content = fs.readFileSync(file, 'utf8');
    const schema = JSON.parse(content);
    const { errors, warnings } = validate(schema);

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

/**
 * Synchronise generated Form Edition property tables in component docs.
 *
 * Only the region between contract-props markers is written. Hand-authored
 * examples, explanations and migration notes are deliberately untouched.
 * Run with --check in CI to verify that checked-in docs are current.
 */

const fs = require('fs');
const path = require('path');

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
  return typeof contract === 'object' ? contract : null;
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
    if (!fs.existsSync(candidate)) continue;
    try {
      if (candidate.endsWith('.json')) return normalizeContract(JSON.parse(fs.readFileSync(candidate, 'utf8')));
      // eslint-disable-next-line global-require, import/no-dynamic-require
      if (!candidate.endsWith('.ts')) return normalizeContract(require(candidate));

      // Keep source-checkout usage build-free: the contract is static TS and
      // can be transpiled in memory without loading React or a renderer.
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

function formatValue(value) {
  if (value === undefined) return '';
  if (typeof value === 'string') return value.replace(/\|/g, '\\|');
  return `\`${JSON.stringify(value)}\``;
}

function formatBindings(binding) {
  if (!binding) return '静态值';
  const accepts = Array.isArray(binding)
    ? binding
    : typeof binding === 'string'
      ? binding.split('|').map((item) => item.trim())
      : binding.accepts || [];
  const modes = accepts.map((item) => `\`${item}\``);
  if (binding && typeof binding === 'object' && binding.pathScope) modes.push(`路径：\`${binding.pathScope}\``);
  if (binding && typeof binding === 'object' && binding.expressionMode === 'pure') modes.push('纯表达式');
  return modes.length > 0 ? modes.join(', ') : '静态值';
}

function renderBlock(name, entry) {
  const allowedProps = [...new Set([
    ...(Array.isArray(entry.allowedProps) ? entry.allowedProps : []),
    ...(entry.properties && typeof entry.properties === 'object' ? Object.keys(entry.properties) : []),
  ])];
  const bindings = entry.bindings || {};
  const properties = entry.properties || {};
  const rows = allowedProps.map((property) => {
    const definition = properties[property] || {};
    const binding = bindings[property] || definition.bindings;
    const description = definition.description || definition.summary || '';
    const defaultValue = definition.default;
    return `| \`${property}\` | ${formatValue(definition.title || '')} | ${formatBindings(binding)} | ${description}${definition.deprecated ? `（已弃用：${definition.deprecated.replacement || '请迁移'}）` : ''} | ${formatValue(defaultValue)} |`;
  });
  if (rows.length === 0) rows.push('| — | — | — | 契约未声明可配置属性 | — |');
  const events = entry.events
    ? (Array.isArray(entry.events) ? entry.events : Object.keys(entry.events)).map((event) => `\`${event}\``).join(', ')
    : '无';
  const childrenMode = entry.childrenMode || '未声明';
  const dataModel = entry.dataModelBinding
    ? `\`${entry.dataModelBinding.prop}\`（${entry.dataModelBinding.valueTypes.join(' | ')}）`
    : '无';
  const dependencies = entry.dependencies && entry.dependencies.length > 0
    ? entry.dependencies.map((dependency) => dependency.message || `${dependency.when || ''} → ${dependency.requires}`).join('；')
    : '无';
  const notes = entry.notes && entry.notes.length > 0 ? entry.notes.join('；') : '无';
  return [
    '<!-- contract-props:start -->',
    `## Form 契约属性（${name}）`,
    '',
    '| 属性 | 标题 | 动态绑定 | 说明 | 默认值 |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    `- 子节点模式：\`${childrenMode}\``,
    `- 事件：${events}`,
    `- dataModel 绑定：${dataModel}`,
    `- 属性依赖：${dependencies}`,
    `- 特殊说明：${notes}`,
    '<!-- contract-props:end -->',
  ].join('\n');
}

function findInitialInsertion(source) {
  // Existing Form docs use either "核心属性" or "属性" sections. Replace
  // only the first Markdown table in that section; surrounding examples and
  // hand-written guidance remain unchanged.
  const section = /^##\s+[^\n]*(?:核心属性|属性)(?:\s|$)[^\n]*\n/m.exec(source);
  if (section) {
    const sectionStart = section.index + section[0].length;
    const nextHeading = /^##\s+/m.exec(source.slice(sectionStart));
    const sectionEnd = nextHeading ? sectionStart + nextHeading.index : source.length;
    const body = source.slice(sectionStart, sectionEnd);
    const table = /(^\|[^\n]+\n\|[-: |]+\n(?:\|[^\n]*\n)*)/m.exec(body);
    if (table) {
      return { start: sectionStart + table.index, end: sectionStart + table.index + table[0].length };
    }
    // Some docs explain properties with nested headings/examples and do not
    // have a Markdown table. Append the generated contract at the end of the
    // section, immediately before the next top-level heading.
    return { start: sectionEnd, end: sectionEnd };
  }
  return null;
}

function parseArgs(argv) {
  const result = { check: false, contract: undefined, docsDir: path.join(process.cwd(), 'docs', 'components') };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') result.check = true;
    else if (arg === '--contract') result.contract = argv[++index];
    else if (arg.startsWith('--contract=')) result.contract = arg.slice('--contract='.length);
    else if (arg === '--docs-dir') result.docsDir = argv[++index];
    else if (arg.startsWith('--docs-dir=')) result.docsDir = arg.slice('--docs-dir='.length);
  }
  return result;
}

const options = parseArgs(process.argv.slice(2));
const contract = loadContract(options.contract);
if (!contract) {
  console.error('Form contract is unavailable; build or provide it with --contract <file>');
  process.exit(1);
}

let changed = 0;
let stale = 0;
let missing = 0;
const docs = new Map();
for (const [name, entry] of Object.entries(contract)) {
  if (!entry || typeof entry !== 'object') continue;
  const slug = entry.documentationSlug || entry.slug || name;
  if (!docs.has(slug)) docs.set(slug, { name, entry });
}
for (const { name, entry } of docs.values()) {
  if (!entry || typeof entry !== 'object') continue;
  const slug = entry.documentationSlug || entry.slug || name;
  const file = path.join(options.docsDir, `${slug}.md`);
  if (!fs.existsSync(file)) {
    missing += 1;
    console.warn(`Missing component doc for ${name}: ${file}`);
    continue;
  }
  const source = fs.readFileSync(file, 'utf8');
  const start = '<!-- contract-props:start -->';
  const end = '<!-- contract-props:end -->';
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) {
    if (!options.check) {
      const insertion = findInitialInsertion(source);
      if (insertion) {
        const block = renderBlock(name, entry);
        const next = `${source.slice(0, insertion.start)}${block}\n${source.slice(insertion.end)}`;
        fs.writeFileSync(file, next);
        changed += 1;
        continue;
      }
    }
    missing += 1;
    console.warn(`Missing contract markers in ${file}`);
    continue;
  }
  const block = renderBlock(name, entry);
  const next = `${source.slice(0, startIndex)}${block}${source.slice(endIndex + end.length)}`;
  if (next !== source) {
    stale += 1;
    if (!options.check) {
      fs.writeFileSync(file, next);
      changed += 1;
    }
  }
}

if (options.check && (stale > 0 || missing > 0)) {
  console.error(`Contract docs are out of date: ${stale} stale, ${missing} missing`);
  process.exit(1);
}
console.log(options.check
  ? 'Contract docs are in sync.'
  : `Contract docs synchronised (${changed} updated, ${missing} missing markers/docs).`);

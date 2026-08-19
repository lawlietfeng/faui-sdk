import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const validator = path.join(process.cwd(), 'scripts', 'validate-schema.cjs');

function writeFixture(schema: unknown, contract: unknown) {
  const directory = mkdtempSync(path.join(tmpdir(), 'faui-validator-'));
  const schemaPath = path.join(directory, 'schema.json');
  const contractPath = path.join(directory, 'contract.json');
  writeFileSync(schemaPath, JSON.stringify(schema));
  writeFileSync(contractPath, JSON.stringify(contract));
  return { directory, schemaPath, contractPath };
}

describe('validate-schema Form strict mode', () => {
  it('validates bindings from an external static contract', () => {
    const fixture = writeFixture([
      {
        type: 'ACTIVITY_SNAPSHOT',
        content: {
          components: [
            { id: 'root', component: 'box', children: ['items'] },
            { id: 'items', component: 'repeater', data: { path: '/items' }, children: ['name'] },
            { id: 'name', component: 'input', value: { path: './name' } },
          ],
          dataModel: { items: [{ name: 'Ada' }] },
        },
      },
    ], {
      formComponentContracts: {
        box: { allowedProps: ['id', 'component', 'children'] },
        repeater: { allowedProps: ['id', 'component', 'data', 'children'], bindings: { data: 'path' } },
        input: { allowedProps: ['id', 'component', 'value'], bindings: { value: 'path' } },
      },
    });

    try {
      expect(() => execFileSync(
        process.execPath,
        [validator, '--mode=form-strict', '--contract', fixture.contractPath, fixture.schemaPath],
        { encoding: 'utf8', stdio: 'pipe' },
      )).not.toThrow();
      // Source checkouts should also resolve the static TS contract without a
      // build step or an explicit JSON export.
      expect(() => execFileSync(
        process.execPath,
        [validator, '--mode=form-strict', fixture.schemaPath],
        { encoding: 'utf8', stdio: 'pipe' },
      )).not.toThrow();
    } finally {
      rmSync(fixture.directory, { recursive: true, force: true });
    }
  });

  it('keeps the default mode compatible with schemas outside the contract', () => {
    const fixture = writeFixture([
      {
        type: 'ACTIVITY_SNAPSHOT',
        content: { components: [{ id: 'root', component: 'legacy-widget' }], dataModel: {} },
      },
    ], { formComponentContracts: {} });

    try {
      const output = execFileSync(process.execPath, [validator, fixture.schemaPath], { encoding: 'utf8' });
      expect(output).toContain('Unknown component type: "legacy-widget"');
    } finally {
      rmSync(fixture.directory, { recursive: true, force: true });
    }
  });

  it('rejects undeclared properties in strict mode', () => {
    const fixture = writeFixture([
      {
        type: 'ACTIVITY_SNAPSHOT',
        content: { components: [{ id: 'root', component: 'box', secret: true }], dataModel: {} },
      },
    ], { formComponentContracts: { box: { allowedProps: ['id', 'component'] } } });

    try {
      expect(() => execFileSync(
        process.execPath,
        [validator, '--mode=form-strict', '--contract', fixture.contractPath, fixture.schemaPath],
        { encoding: 'utf8', stdio: 'pipe' },
      )).toThrow();
    } finally {
      rmSync(fixture.directory, { recursive: true, force: true });
    }
  });
});

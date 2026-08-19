import { describe, expect, it } from 'vitest';
import { FormComponentRegistry } from '../../src/components/formRegistry';
import {
  formComponentContractVersion,
  formComponentContracts,
  formSchemaContract,
} from '../../src/manifest';

describe('Form component contracts', () => {
  it('covers every Form Registry name without importing runtime metadata into the contract module', () => {
    expect(Object.keys(formComponentContracts).sort()).toEqual(Object.keys(FormComponentRegistry).sort());
    expect(formComponentContractVersion).toBe(1);
    for (const [name, item] of Object.entries(formComponentContracts)) {
      expect(item.component).toBe(name);
      expect(item.allowedProps).toContain('id');
      expect(item.allowedProps).toContain('component');
      expect(item.properties.id).toBeDefined();
      expect(item.properties.visible).toBeDefined();
    }
  });

  it('publishes the agreed dynamic binding and compatibility rules', () => {
    expect(formComponentContracts.input.properties.value.bindings?.accepts).toEqual(['path']);
    expect(formComponentContracts.input.properties.disabled.bindings?.accepts).toEqual(['boolean', 'expression', 'path']);
    expect(formComponentContracts.checkbox.dataModelBinding?.prop).toBe('checked');
    expect(formComponentContracts.checkbox.deprecated?.value?.replacement).toBe('checked');
    expect(formComponentContracts.skeleton.properties.loading.bindings?.accepts).toEqual(['boolean', 'expression', 'path']);
    expect(formComponentContracts.skeleton.deprecated?.visible?.replacement).toBe('loading');
    expect(formComponentContracts.condition.dependencies?.length).toBe(4);
    expect(formComponentContracts.repeater.childrenMode).toBe('template-component-ids');
    expect(formSchemaContract.paths.repeaterRelative.allowedOnlyIn).toEqual(['repeater.children']);
  });

  it('is JSON serialisable static data', () => {
    expect(JSON.parse(JSON.stringify(formComponentContracts))).toEqual(formComponentContracts);
    expect(JSON.parse(JSON.stringify(formSchemaContract))).toEqual(formSchemaContract);
  });
});

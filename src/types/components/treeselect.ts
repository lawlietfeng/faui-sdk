import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';

export interface TreeselectComponentConfig extends BaseComponentConfig {
  component: 'treeselect';
  field?: string;
  rules?: FormRule[];
  options?: Array<{ label: string; value: string; children?: any[] }> | string;
  multiple?: boolean | string;
  placeholder?: string;
  disabled?: boolean | string;
}

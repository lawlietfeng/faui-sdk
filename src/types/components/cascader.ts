import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';

export interface CascaderComponentConfig extends BaseComponentConfig {
  component: 'cascader';
  field?: string;
  rules?: FormRule[];
  options?: Array<{ label: string; value: string; children?: any[] }>;
}

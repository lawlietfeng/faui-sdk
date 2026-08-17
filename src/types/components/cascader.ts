import type { BaseComponentConfig, ComponentControlValue } from '../schema';
import type { FormRule } from '../schema';

export interface CascaderComponentConfig extends BaseComponentConfig {
  component: 'cascader';
  field?: string;
  disabled?: ComponentControlValue;
  rules?: FormRule[];
  options?: Array<{ label: string; value: string; children?: any[] }>;
}

import type { BaseComponentConfig, ComponentControlValue, ComponentOptions, FormRule } from '../schema';

export interface SelectComponentConfig extends BaseComponentConfig {
  component: 'select';
  field?: string;
  placeholder?: string;
  options?: ComponentOptions;
  rules?: FormRule[];
  mode?: 'multiple' | 'tags';
  disabled?: ComponentControlValue;
  allowClear?: ComponentControlValue;
  showSearch?: ComponentControlValue;
  maxTagCount?: number | string;
}

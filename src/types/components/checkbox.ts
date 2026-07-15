import type { BaseComponentConfig, ComponentOptions, FormRule, ValueBinding } from '../schema';

export interface CheckboxComponentConfig extends BaseComponentConfig {
  component: 'checkbox';
  field?: string;
  options?: ComponentOptions;
  rules?: FormRule[];
  checked?: ValueBinding;
}

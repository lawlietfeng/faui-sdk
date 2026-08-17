import type { BaseComponentConfig, ComponentControlValue, ComponentOptions, FormRule, ValueBinding } from '../schema';

export interface CheckboxComponentConfig extends BaseComponentConfig {
  component: 'checkbox';
  field?: string;
  options?: ComponentOptions;
  disabled?: ComponentControlValue;
  rules?: FormRule[];
  checked?: ValueBinding;
}

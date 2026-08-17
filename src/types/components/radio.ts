import type { BaseComponentConfig, ComponentControlValue, ComponentOptions, FormRule } from '../schema';

export interface RadioComponentConfig extends BaseComponentConfig {
  component: 'radio';
  field?: string;
  options?: ComponentOptions;
  disabled?: ComponentControlValue;
  rules?: FormRule[];
}

import type { BaseComponentConfig, ComponentOptions, FormRule } from '../schema';

export interface RadioComponentConfig extends BaseComponentConfig {
  component: 'radio';
  field?: string;
  options?: ComponentOptions;
  rules?: FormRule[];
}

import type { BaseComponentConfig, ComponentControlValue } from '../schema';
import type { FormRule } from '../schema';

export interface InputComponentConfig extends BaseComponentConfig {
  component: 'input';
  field?: string;
  placeholder?: string;
  disabled?: ComponentControlValue;
  rules?: FormRule[];
}

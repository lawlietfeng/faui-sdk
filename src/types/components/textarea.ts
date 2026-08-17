import type { BaseComponentConfig, ComponentControlValue } from '../schema';
import type { FormRule } from '../schema';

export interface TextareaComponentConfig extends BaseComponentConfig {
  component: 'textarea';
  field?: string;
  placeholder?: string;
  rules?: FormRule[];
  disabled?: ComponentControlValue;
  rows?: number | string;
  maxLength?: number | string;
}

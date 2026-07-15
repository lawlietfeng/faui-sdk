import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';

export interface TextareaComponentConfig extends BaseComponentConfig {
  component: 'textarea';
  field?: string;
  placeholder?: string;
  rules?: FormRule[];
  disabled?: boolean | string;
  rows?: number | string;
  maxLength?: number | string;
}

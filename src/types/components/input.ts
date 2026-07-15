import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';

export interface InputComponentConfig extends BaseComponentConfig {
  component: 'input';
  field?: string;
  placeholder?: string;
  rules?: FormRule[];
}

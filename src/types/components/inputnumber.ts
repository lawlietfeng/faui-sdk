import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';

export interface InputnumberComponentConfig extends BaseComponentConfig {
  component: 'inputnumber';
  field?: string;
  rules?: FormRule[];
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  disabled?: boolean | string;
}

import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';

export interface SliderComponentConfig extends BaseComponentConfig {
  component: 'slider';
  field?: string;
  rules?: FormRule[];
  min?: number | string;
  max?: number | string;
  step?: number | string;
  range?: boolean | string;
  disabled?: boolean | string;
}

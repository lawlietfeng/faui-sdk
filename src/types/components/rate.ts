import type { BaseComponentConfig, ComponentControlValue } from '../schema';
import type { FormRule } from '../schema';

export interface RateComponentConfig extends BaseComponentConfig {
  component: 'rate';
  field?: string;
  disabled?: ComponentControlValue;
  rules?: FormRule[];
  allowHalf?: boolean | string;
  count?: number | string;
}

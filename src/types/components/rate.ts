import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';

export interface RateComponentConfig extends BaseComponentConfig {
  component: 'rate';
  field?: string;
  rules?: FormRule[];
  allowHalf?: boolean | string;
  count?: number | string;
}

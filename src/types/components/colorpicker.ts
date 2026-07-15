import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';

export interface ColorpickerComponentConfig extends BaseComponentConfig {
  component: 'colorpicker';
  field?: string;
  rules?: FormRule[];
}

import type { BaseComponentConfig, ComponentControlValue } from '../schema';
import type { FormRule } from '../schema';

export interface ColorpickerComponentConfig extends BaseComponentConfig {
  component: 'colorpicker';
  field?: string;
  disabled?: ComponentControlValue;
  rules?: FormRule[];
}

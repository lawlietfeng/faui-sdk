import type { BaseComponentConfig, ComponentControlValue, FormRule } from '../schema';

export interface TimepickerComponentConfig extends BaseComponentConfig {
  component: 'timepicker';
  field?: string;
  rules?: FormRule[];
  format?: string;
  placeholder?: string;
  disabled?: ComponentControlValue;
  minuteStep?: number | string;
  secondStep?: number | string;
  hourStep?: number | string;
}

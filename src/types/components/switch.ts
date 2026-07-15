import type { BaseComponentConfig, ComponentControlValue, FormRule, ValueBinding } from '../schema';

export interface SwitchComponentConfig extends BaseComponentConfig {
  component: 'switch';
  field?: string;
  rules?: FormRule[];
  checkedChildren?: string;
  unCheckedChildren?: string;
  checked?: ValueBinding;
  disabled?: ComponentControlValue;
  size?: 'small' | 'default' | string;
}

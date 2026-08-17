import { BaseComponentConfig, ComponentControlValue, FormRule } from '../schema';

export interface SegmentedOption {
  label: string;
  value: string | number;
  icon?: string;
  disabled?: boolean | string;
}

export interface SegmentedComponentConfig extends BaseComponentConfig {
  component: 'segmented';
  field?: string;
  rules?: FormRule[];
  options: (string | number | SegmentedOption)[] | string;
  block?: boolean | string;
  disabled?: ComponentControlValue;
  size?: 'large' | 'middle' | 'small' | string;
}

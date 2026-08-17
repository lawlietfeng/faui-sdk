import type { BaseComponentConfig, ComponentControlValue } from '../schema';

export interface ButtonComponentConfig extends BaseComponentConfig {
  component: 'button';
  label?: string;
  title?: string;
  color?: string;
  disabled?: ComponentControlValue;
  type?: 'primary' | 'dashed' | 'link' | 'text' | 'default';
  danger?: boolean;
  ghost?: boolean;
  shape?: 'default' | 'circle' | 'round';
  size?: 'large' | 'middle' | 'small';
  block?: boolean;
}

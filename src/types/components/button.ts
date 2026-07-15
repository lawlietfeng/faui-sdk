import type { BaseComponentConfig } from '../schema';

export interface ButtonComponentConfig extends BaseComponentConfig {
  component: 'button';
  label?: string;
  title?: string;
  color?: string;
  disabled?: boolean;
  type?: 'primary' | 'dashed' | 'link' | 'text' | 'default';
  danger?: boolean;
  ghost?: boolean;
  shape?: 'default' | 'circle' | 'round';
  size?: 'large' | 'middle' | 'small';
  block?: boolean;
}

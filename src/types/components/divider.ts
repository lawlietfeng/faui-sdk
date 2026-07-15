import type { BaseComponentConfig } from '../schema';

export interface DividerComponentConfig extends BaseComponentConfig {
  component: 'divider';
  direction?: 'horizontal' | 'vertical';
  align?: 'start' | 'center' | 'end';
  content?: string;
}

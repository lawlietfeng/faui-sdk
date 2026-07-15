import type { BaseComponentConfig } from '../schema';

export interface SiderComponentConfig extends BaseComponentConfig {
  component: 'sider';
  width?: string | number;
  collapsible?: boolean;
  collapsedWidth?: number;
  reverseArrow?: boolean;
  theme?: 'light' | 'dark';
}

import type { BaseComponentConfig } from '../schema';

export interface ProgressComponentConfig extends BaseComponentConfig {
  component: 'progress';
  percent?: number | string;
  status?: 'success' | 'info' | 'warning' | 'error' | 'active' | 'exception' | 'normal' | string;
  size?: 'small' | 'default' | number | string;
}

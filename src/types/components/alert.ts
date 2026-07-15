import type { BaseComponentConfig } from '../schema';

export interface AlertComponentConfig extends BaseComponentConfig {
  component: 'alert';
  description?: string;
  showIcon?: boolean;
  status?: 'success' | 'info' | 'warning' | 'error' | 'active' | 'exception' | 'normal';
}

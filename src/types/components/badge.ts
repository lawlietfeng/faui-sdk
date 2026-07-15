import type { BaseComponentConfig } from '../schema';

export interface BadgeComponentConfig extends BaseComponentConfig {
  component: 'badge';
  count?: number;
  dot?: boolean;
  overflowCount?: number;
  showZero?: boolean;
  status?: 'success' | 'info' | 'warning' | 'error' | 'active' | 'exception' | 'normal';
  color?: string;
}

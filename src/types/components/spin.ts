import type { BaseComponentConfig } from '../schema';

export interface SpinComponentConfig extends BaseComponentConfig {
  component: 'spin';
  spinning?: boolean | string;
  tip?: string;
  size?: 'small' | 'default' | 'large' | string;
}

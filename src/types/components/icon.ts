import type { BaseComponentConfig } from '../schema';

export interface IconComponentConfig extends BaseComponentConfig {
  component: 'icon';
  icon?: string;
  spin?: boolean;
  rotate?: number;
}

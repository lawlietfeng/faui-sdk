import type { BaseComponentConfig } from '../schema';

export interface CardComponentConfig extends BaseComponentConfig {
  component: 'card';
  title?: string;
  bordered?: boolean;
  variant?: 'borderless' | 'outlined';
  size?: string;
}

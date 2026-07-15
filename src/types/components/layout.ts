import type { BaseComponentConfig } from '../schema';

export interface LayoutComponentConfig extends BaseComponentConfig {
  component: 'layout';
  hasSider?: boolean;
}

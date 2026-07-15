import type { BaseComponentConfig } from '../schema';

export interface BoxComponentConfig extends BaseComponentConfig {
  component: 'box';
  padding?: number | string;
  layout?: 'vertical' | 'horizontal';
  spacing?: number;
  align?: string;
  justify?: string;
}

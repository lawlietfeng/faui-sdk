import type { BaseComponentConfig } from '../schema';

export interface SpaceComponentConfig extends BaseComponentConfig {
  component: 'space';
  direction?: 'horizontal' | 'vertical' | string;
  size?: 'small' | 'middle' | 'large' | number | [number, number] | string;
  align?: 'start' | 'end' | 'center' | 'baseline' | string;
  split?: string;
  wrap?: boolean | string;
}

import type { BaseComponentConfig } from '../schema';

export interface FlexComponentConfig extends BaseComponentConfig {
  component: 'flex';
  vertical?: boolean;
  wrap?: string | boolean;
  gap?: string | number;
  flex?: string | number;
  align?: string;
  justify?: string;
}

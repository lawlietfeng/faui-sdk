import type { BaseComponentConfig } from '../schema';

export interface TextComponentConfig extends BaseComponentConfig {
  component: 'text';
  color?: string;
  title?: string;
}

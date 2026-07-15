import type { BaseComponentConfig } from '../schema';

export interface EmptyComponentConfig extends BaseComponentConfig {
  component: 'empty';
  image?: 'default' | 'simple' | string;
  imageStyle?: Record<string, string | number>;
  description?: string;
}

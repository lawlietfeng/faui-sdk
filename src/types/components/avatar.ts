import type { BaseComponentConfig } from '../schema';

export interface AvatarComponentConfig extends BaseComponentConfig {
  component: 'avatar';
  shape?: 'circle' | 'square' | 'round' | 'default';
  icon?: string;
  size?: string | number;
  src?: string;
  alt?: string;
}

import type { BaseComponentConfig } from '../schema';

export interface ImageComponentConfig extends BaseComponentConfig {
  component: 'image';
  src?: string;
  alt?: string;
  preview?: boolean;
}

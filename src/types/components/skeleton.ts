import type { BaseComponentConfig } from '../schema';

export interface SkeletonComponentConfig extends BaseComponentConfig {
  component: 'skeleton';
  active?: boolean | string;
  avatar?: boolean | { active?: boolean; shape?: 'circle' | 'square'; size?: 'large' | 'small' | 'default' | number } | string;
  paragraph?: boolean | { rows?: number; width?: string | number | Array<string | number> } | string;
  round?: boolean | string;
  title?: boolean | { width?: string | number } | string | any;
  skeletonType?: 'button' | 'avatar' | 'input' | 'image' | 'node' | string;
  shape?: 'circle' | 'square' | 'round' | 'default' | string;
  block?: boolean | string;
  size?: 'large' | 'small' | 'default' | number | string;
}

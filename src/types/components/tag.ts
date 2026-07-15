import type { BaseComponentConfig } from '../schema';

export interface TagComponentConfig extends BaseComponentConfig {
  component: 'tag';
  color?: string;
  bordered?: boolean | string;
}

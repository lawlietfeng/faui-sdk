import type { BaseComponentConfig } from '../schema';

export interface CollapseComponentConfig extends BaseComponentConfig {
  component: 'collapse';
  bordered?: boolean;
  options?: Array<{ label: string; value: string; children?: any[] }>;
}

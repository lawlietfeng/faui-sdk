import type { BaseComponentConfig } from '../schema';

export interface DescriptionsComponentConfig extends BaseComponentConfig {
  component: 'descriptions';
  title?: string;
  column?: number;
  bordered?: boolean;
  options?: Array<{ label: string; value: string; children?: any[] }>;
}

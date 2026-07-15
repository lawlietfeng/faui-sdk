import type { BaseComponentConfig, ValueBinding } from '../schema';

export interface RepeaterComponentConfig extends BaseComponentConfig {
  component: 'repeater';
  data?: ValueBinding;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  emptyContent?: string;
  keyField?: string;
}

import type { BaseComponentConfig } from '../schema';
import type { ValueBinding } from '../schema';

export interface ListComponentConfig extends BaseComponentConfig {
  component: 'list';
  data?: ValueBinding;
}

import type { BaseComponentConfig } from '../schema';
import type { TimelineItemType } from '../schema';
import type { ValueBinding } from '../schema';

export interface TimelineComponentConfig extends BaseComponentConfig {
  component: 'timeline';
  data?: ValueBinding;
  mode?: 'left' | 'alternate' | 'right' | string;
  pending?: boolean | string;
  reverse?: boolean | string;
  items?: TimelineItemType[] | string;
}

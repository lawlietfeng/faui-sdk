import type { BaseComponentConfig, ComponentControlValue } from '../schema';
import type { FormRule } from '../schema';

export interface MentionsComponentConfig extends BaseComponentConfig {
  component: 'mentions';
  field?: string;
  disabled?: ComponentControlValue;
  rules?: FormRule[];
  options?: Array<{ label: string; value: string; children?: any[] }>;
  prefix?: string | string[];
}

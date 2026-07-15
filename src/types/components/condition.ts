import type { BaseComponentConfig, ValueBinding } from '../schema';

export interface ConditionComponentConfig extends BaseComponentConfig {
  component: 'condition';
  when?: string | boolean | ValueBinding;
  then?: string[];
  else?: string[];
  match?: string | ValueBinding;
  cases?: Record<string, string[]>;
  default?: string[];
}

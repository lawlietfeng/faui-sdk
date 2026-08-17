import type { BaseComponentConfig, ComponentControlValue } from '../schema';
import type { FormRule } from '../schema';

export interface AutocompleteComponentConfig extends BaseComponentConfig {
  component: 'autocomplete';
  field?: string;
  disabled?: ComponentControlValue;
  rules?: FormRule[];
  options?: Array<{ label: string; value: string; children?: any[] }>;
}

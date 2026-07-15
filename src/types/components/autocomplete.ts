import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';

export interface AutocompleteComponentConfig extends BaseComponentConfig {
  component: 'autocomplete';
  field?: string;
  rules?: FormRule[];
  options?: Array<{ label: string; value: string; children?: any[] }>;
}

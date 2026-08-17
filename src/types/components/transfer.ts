import type { BaseComponentConfig, ComponentControlValue } from '../schema';
import type { FormRule } from '../schema';
import type { ValueBinding } from '../schema';

export interface TransferComponentConfig extends BaseComponentConfig {
  component: 'transfer';
  field?: string;
  disabled?: ComponentControlValue;
  rules?: FormRule[];
  data?: ValueBinding;
}

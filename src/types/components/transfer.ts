import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';
import type { ValueBinding } from '../schema';

export interface TransferComponentConfig extends BaseComponentConfig {
  component: 'transfer';
  field?: string;
  rules?: FormRule[];
  data?: ValueBinding;
}

import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';
import type { ValidateTrigger } from '../schema';

export interface FormComponentConfig extends BaseComponentConfig {
  component: 'form';
  rules?: FormRule[];
  submitButtonId?: string;
  validateTrigger?: ValidateTrigger | ValidateTrigger[];
  layout?: 'vertical' | 'horizontal';
}

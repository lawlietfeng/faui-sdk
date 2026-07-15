import type { BaseComponentConfig } from '../schema';
import type { FormRule, ValueBinding } from '../schema';

export interface DatepickerComponentConfig extends BaseComponentConfig {
  component: 'datepicker';
  field?: string;
  placeholder?: string;
  rules?: FormRule[];
  picker?: 'date' | 'month' | 'year';
  format?: string;
  showTime?: boolean;
  disabledDate?: {
    before?: ValueBinding;
    after?: ValueBinding;
  };
}

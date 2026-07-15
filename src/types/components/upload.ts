import type { BaseComponentConfig } from '../schema';
import type { FormRule } from '../schema';

export interface UploadComponentConfig extends BaseComponentConfig {
  component: 'upload';
  field?: string;
  rules?: FormRule[];
  accept?: string;
  multiple?: boolean | string;
  maxCount?: number | string;
  listType?: 'text' | 'picture' | 'picture-card' | string;
  showUploadList?: boolean | string;
}

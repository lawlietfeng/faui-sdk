import type { BaseComponentConfig } from '../schema';
import type { ValueBinding } from '../schema';
import type { TableColumn } from '../schema';
import type { TablePagination } from '../schema';

export interface TableComponentConfig extends BaseComponentConfig {
  component: 'table';
  data?: ValueBinding;
  columns?: TableColumn[] | string;
  rowKey?: string;
  pagination?: boolean | TablePagination | string;
  bordered?: boolean | string;
  tableSize?: 'small' | 'middle' | 'large' | string;
  emptyText?: string;
}

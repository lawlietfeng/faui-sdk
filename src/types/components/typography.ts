import type { BaseComponentConfig } from '../schema';

export interface TypographyComponentConfig extends BaseComponentConfig {
  component: 'typography' | 'text' | 'title' | 'paragraph' | 'link';
  variant?: 'text' | 'title' | 'paragraph' | 'link' | string;
  textType?: 'secondary' | 'success' | 'warning' | 'danger' | string;
  type?: 'secondary' | 'success' | 'warning' | 'danger' | string;
  level?: 1 | 2 | 3 | 4 | 5 | number | string;
  disabled?: boolean | string;
  mark?: boolean | string;
  code?: boolean | string;
  keyboard?: boolean | string;
  underline?: boolean | string;
  delete?: boolean | string;
  strong?: boolean | string;
  italic?: boolean | string;
  ellipsis?: boolean | { rows?: number; expandable?: boolean; suffix?: string; symbol?: string; tooltip?: boolean | string } | string;
  copyable?: boolean | { text?: string; tooltips?: boolean | [string, string] } | string;
  href?: string;
  target?: string;
  items?: TypographyComponentConfig[] | string;
}

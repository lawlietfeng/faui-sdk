import type { BaseComponentConfig } from '../schema';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface RowComponentConfig extends BaseComponentConfig {
  component: 'row';
  wrap?: boolean;
  gutter?: number | [number, number] | Partial<Record<Breakpoint, number>>;
  align?: string;
  justify?: string;
}

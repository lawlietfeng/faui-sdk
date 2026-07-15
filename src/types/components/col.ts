import type { BaseComponentConfig } from '../schema';

type ColSpanType = {
  span?: number;
  offset?: number;
  order?: number;
  pull?: number;
  push?: number;
};

export interface ColComponentConfig extends BaseComponentConfig {
  component: 'col';
  flex?: string | number;
  span?: number;
  offset?: number;
  push?: number;
  pull?: number;
  order?: number;
  xs?: number | ColSpanType;
  sm?: number | ColSpanType;
  md?: number | ColSpanType;
  lg?: number | ColSpanType;
  xl?: number | ColSpanType;
  xxl?: number | ColSpanType;
}

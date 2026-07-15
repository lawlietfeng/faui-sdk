import type { BaseComponentConfig, ValueBinding } from '../schema';

export interface ChartComponentConfig extends BaseComponentConfig {
  component: 'chart';
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'radar' | 'gauge' | 'funnel' | 'heatmap';
  data?: ValueBinding;
  xField?: string;
  yField?: string | string[];
  seriesField?: string;
  smooth?: boolean;
  stacked?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  option?: Record<string, unknown>;
  height?: number | string;
  theme?: 'light' | 'dark' | string;
  loading?: boolean | string;
}

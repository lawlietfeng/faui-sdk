import type { BaseComponentConfig } from '../schema';
import React from 'react';

export interface StatisticComponentConfig extends BaseComponentConfig {
  component: 'statistic';
  title?: string;
  precision?: number | string;
  prefix?: string | React.ReactNode | string[];
  suffix?: string | React.ReactNode | string[];
  valueStyle?: Record<string, string | number> | string;
  isCountdown?: boolean | string;
  format?: string;
  countUp?: boolean | number | string;
}

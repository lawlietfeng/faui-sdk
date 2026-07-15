import type { BaseComponentConfig } from '../schema';
import type { Step } from '../schema';

export interface StepindicatorComponentConfig extends BaseComponentConfig {
  component: 'stepindicator';
  direction?: 'horizontal' | 'vertical' | string;
  current?: number | string;
  steps?: Step[] | string;
}

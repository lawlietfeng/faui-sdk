import { BaseComponentConfig, ValueBinding, ActionConfig } from '../schema';

export interface StepItem {
  title: string;
  description?: string;
  subTitle?: string;
  status?: 'wait' | 'process' | 'finish' | 'error';
  icon?: string;
  disabled?: boolean;
}

export interface StepsComponentConfig extends BaseComponentConfig {
  component: 'steps';
  
  // Data source
  items: StepItem[] | string;
  
  // Binding for the current step index
  current?: ValueBinding;
  
  // Visual config
  direction?: 'horizontal' | 'vertical' | string;
  labelPlacement?: 'horizontal' | 'vertical' | string;
  progressDot?: boolean | string;
  size?: 'small' | 'default' | string;
  status?: 'wait' | 'process' | 'finish' | 'error' | string;
  type?: 'default' | 'navigation' | 'inline' | string;
  
  // Event
  on_change?: ActionConfig;
}

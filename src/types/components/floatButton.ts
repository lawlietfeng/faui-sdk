import { BaseComponentConfig, ValueBinding, ActionConfig } from '../schema';

export interface FloatButtonItemConfig {
  id?: string;
  icon?: string;
  description?: string;
  tooltip?: string;
  type?: 'default' | 'primary';
  shape?: 'circle' | 'square';
  href?: string;
  target?: string;
  badge?: {
    count?: number;
    dot?: boolean;
    overflowCount?: number;
  };
  on_tap?: ActionConfig | ActionConfig[];
}

export interface FloatButtonComponentConfig extends BaseComponentConfig {
  component: 'float_button';
  /**
   * FloatButton 变体：
   * default - 普通悬浮按钮
   * group - 悬浮按钮组
   * back-top - 回到顶部按钮
   */
  variant?: 'default' | 'group' | 'back-top';
  
  // -- 基础属性 --
  icon?: string;
  description?: string;
  tooltip?: string;
  type?: 'default' | 'primary';
  shape?: 'circle' | 'square';
  href?: string;
  target?: string;
  badge?: {
    count?: number;
    dot?: boolean;
    overflowCount?: number;
  };

  // -- Group 专有属性 --
  trigger?: 'click' | 'hover';
  open?: ValueBinding | boolean;
  items?: FloatButtonItemConfig[];

  // -- BackTop 专有属性 --
  visibilityHeight?: number;

  on_open_change?: ActionConfig | ActionConfig[];
}

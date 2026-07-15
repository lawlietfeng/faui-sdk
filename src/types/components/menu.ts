import type { BaseComponentConfig, ActionConfig, ValueBinding } from '../schema';

export interface MenuItemConfig {
  key: string;
  label?: string;
  icon?: string;
  disabled?: boolean;
  type?: 'group' | 'divider' | 'item' | 'submenu';
  children?: MenuItemConfig[];
}

export interface MenuComponentConfig extends BaseComponentConfig {
  component: 'menu';
  mode?: 'vertical' | 'horizontal' | 'inline';
  theme?: 'light' | 'dark';
  items?: MenuItemConfig[];
  
  // Data bindings for controlled state
  selectedKeys?: ValueBinding;
  openKeys?: ValueBinding;
  
  // Default states if uncontrolled
  defaultSelectedKeys?: string[];
  defaultOpenKeys?: string[];
  
  // Actions
  on_click?: ActionConfig;
  on_select?: ActionConfig;
  on_open_change?: ActionConfig;
  
  inlineCollapsed?: boolean;
  inlineIndent?: number;
  multiple?: boolean;
  selectable?: boolean;
}

import type { BaseComponentConfig } from '../schema';

export interface TabItemConfig {
  key: string;
  label: string | Record<string, any>;
  children?: string[];
  disabled?: boolean;
  forceRender?: boolean;
  closable?: boolean;
}

export interface TabsComponentConfig extends BaseComponentConfig {
  component: 'tabs';
  items?: TabItemConfig[];
  activeKey?: string | { path: string };
  defaultActiveKey?: string;
  type?: 'line' | 'card' | 'editable-card';
  size?: 'large' | 'middle' | 'small';
  tabPlacement?: 'top' | 'start' | 'bottom' | 'end';
  centered?: boolean;
  destroyOnHidden?: boolean;
  animated?: boolean;
}

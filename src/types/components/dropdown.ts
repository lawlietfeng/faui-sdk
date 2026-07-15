import { BaseComponentConfig, ValueBinding, ActionConfig } from '../schema';

export interface DropdownMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  icon?: string; // 图标组件 ID 或直接的字符串标识（需配合渲染逻辑处理）
  type?: 'group' | 'divider';
  children?: DropdownMenuItem[];
}

export interface DropdownComponentConfig extends BaseComponentConfig {
  component: 'dropdown';
  /**
   * 菜单项配置列表
   */
  items?: DropdownMenuItem[];
  /**
   * 菜单项是否支持选中，支持双向绑定
   */
  selectedKeys?: ValueBinding | string[];
  /**
   * 触发下拉的行为
   */
  trigger?: ('click' | 'hover' | 'contextMenu')[];
  /**
   * 菜单弹出位置
   */
  placement?:
    | 'bottom'
    | 'bottomLeft'
    | 'bottomRight'
    | 'top'
    | 'topLeft'
    | 'topRight';
  /**
   * 箭头是否显示
   */
  arrow?: boolean;
  /**
   * 菜单是否受控打开
   */
  open?: ValueBinding | boolean;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 点击菜单项的回调
   */
  on_menu_click?: ActionConfig | ActionConfig[];
  /**
   * 下拉框显示/隐藏状态改变的回调
   */
  on_open_change?: ActionConfig | ActionConfig[];
}

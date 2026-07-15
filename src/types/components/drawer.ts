import { BaseComponentConfig, ValueBinding, ActionConfig } from '../schema';

export interface DrawerComponentConfig extends BaseComponentConfig {
  component: 'drawer';
  /**
   * 抽屉是否可见，支持双向绑定
   */
  open?: ValueBinding | boolean;
  /**
   * 标题
   */
  title?: string;
  /**
   * 抽屉展开位置
   */
  placement?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * 宽度，在 placement 为 right 或 left 时生效
   */
  width?: string | number;
  /**
   * 高度，在 placement 为 top 或 bottom 时生效
   */
  height?: string | number;
  /**
   * 是否显示右上角的关闭按钮
   */
  closable?: boolean;
  /**
   * 关闭时销毁 Drawer 里的子元素
   */
  destroyOnHidden?: boolean;
  /**
   * 是否支持键盘 esc 关闭
   */
  keyboard?: boolean;
  /**
   * 是否展示遮罩
   */
  mask?: boolean;
  /**
   * 点击蒙层是否允许关闭
   */
  maskClosable?: boolean;
  /**
   * 设置 Drawer 的 z-index
   */
  zIndex?: number;
  /**
   * 抽屉右上角的操作区域
   */
  extra?: string;
  /**
   * 抽屉的页脚
   */
  footer?: string;
  /**
   * 点击遮罩层或右上角叉或取消按钮的回调
   */
  on_close?: ActionConfig | ActionConfig[];
}

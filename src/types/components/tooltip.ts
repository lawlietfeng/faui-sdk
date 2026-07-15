import { BaseComponentConfig, ValueBinding, ActionConfig } from '../schema';

export interface TooltipComponentConfig extends BaseComponentConfig {
  component: 'tooltip';
  /**
   * 提示文字
   */
  title?: string;
  /**
   * 气泡框位置
   */
  placement?:
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'leftTop'
    | 'leftBottom'
    | 'rightTop'
    | 'rightBottom'
    | string;
  /**
   * 触发行为
   */
  trigger?: 'hover' | 'focus' | 'click' | ('hover' | 'focus' | 'click')[] | string;
  /**
   * 是否受控显示，支持双向绑定
   */
  open?: ValueBinding | boolean | string;
  /**
   * 显示隐藏的回调
   */
  on_open_change?: ActionConfig | ActionConfig[];
  /**
   * 是否显示箭头
   */
  arrow?: boolean | string;
  /**
   * 背景颜色
   */
  color?: string;
}

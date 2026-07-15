import { BaseComponentConfig, ActionConfig } from '../schema';

export interface PopconfirmComponentConfig extends BaseComponentConfig {
  component: 'popconfirm';
  /**
   * 确认框的描述
   */
  title?: string;
  /**
   * 确认框的详细描述
   */
  description?: string;
  /**
   * 确认按钮文字
   */
  okText?: string;
  /**
   * 取消按钮文字
   */
  cancelText?: string;
  /**
   * 确认按钮类型
   */
  okType?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
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
    | 'rightBottom';
  /**
   * 点击确认的回调
   */
  on_confirm?: ActionConfig | ActionConfig[];
  /**
   * 点击取消的回调
   */
  on_cancel?: ActionConfig | ActionConfig[];
  /**
   * 阻止点击阻止冒泡
   */
  disabled?: boolean;
}

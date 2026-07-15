import { BaseComponentConfig, ValueBinding, ActionConfig } from '../schema';

export interface ModalComponentConfig extends BaseComponentConfig {
  component: 'modal';
  
  // Modal 特有属性
  open?: ValueBinding | boolean;
  
  // 标题
  title?: string;
  
  // 底部按钮配置
  cancelText?: string;
  okText?: string;
  okType?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
  footer?: boolean | null; // 如果为 null 或 false，则不显示底部
  
  // 样式与行为
  width?: string | number;
  centered?: boolean;
  closable?: boolean;
  destroyOnHidden?: boolean;
  keyboard?: boolean;
  mask?: boolean;
  maskClosable?: boolean;
  zIndex?: number;
  
  // 回调事件
  on_ok?: ActionConfig | ActionConfig[];
  on_cancel?: ActionConfig | ActionConfig[];
}

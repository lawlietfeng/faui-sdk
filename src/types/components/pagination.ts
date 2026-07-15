import type { BaseComponentConfig, ValueBinding } from '../schema';

export interface PaginationComponentConfig extends BaseComponentConfig {
  component: 'pagination';
  
  // 双向绑定属性
  current?: ValueBinding;
  pageSize?: ValueBinding;

  // 常规属性 (支持 useExpression 解析)
  total?: number | string;
  disabled?: boolean | string;
  hideOnSinglePage?: boolean | string;
  showQuickJumper?: boolean | string;
  showSizeChanger?: boolean | string;
  simple?: boolean | string;
  size?: 'default' | 'small' | string;
  responsive?: boolean | string;
  align?: 'start' | 'center' | 'end' | string;
  
  // 如果配置了 showTotal 字符串模板，组件内将其转换为函数
  // 例如： "共 ${total} 条"
  showTotal?: string;
}

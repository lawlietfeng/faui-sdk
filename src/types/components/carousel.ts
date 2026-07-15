import { BaseComponentConfig, ValueBinding } from '../schema';

export interface CarouselComponentConfig extends BaseComponentConfig {
  component: 'carousel';
  // 走马灯特有属性
  autoplay?: boolean;
  autoplaySpeed?: number;
  dotPosition?: 'top' | 'bottom' | 'left' | 'right';
  dots?: boolean;
  effect?: 'scrollx' | 'fade';
  easing?: string;
  waitForAnimate?: boolean;
  
  // 面板内容
  items?: Array<{
    key?: string;
    style?: Record<string, string | number>;
    className?: string;
    children?: string[];
  }>;
  
  // 绑定当前索引
  current?: ValueBinding;
}

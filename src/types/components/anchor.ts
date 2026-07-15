import { BaseComponentConfig, ActionConfig } from '../schema';

export interface AnchorItemConfig {
  key: string;
  href: string;
  title: string;
  target?: string;
  children?: AnchorItemConfig[];
}

export interface AnchorComponentConfig extends BaseComponentConfig {
  component: 'anchor';
  
  /**
   * 锚点数据项
   */
  items?: AnchorItemConfig[];

  /**
   * 固定模式下，距离窗口顶部达到指定偏移量后触发
   */
  offsetTop?: number;
  
  /**
   * 导航锚点方向
   */
  direction?: 'vertical' | 'horizontal';
  
  /**
   * 是否固定
   * 默认为 true
   */
  affix?: boolean;
  
  /**
   * 是否显示左侧小圆点
   * 默认为 true
   */
  showInkInFixed?: boolean;
  
  /**
   * 滚动到目标容器时是否展示动画
   * 默认为 true
   */
  replace?: boolean;

  /**
   * 设置 Anchor 需要监听其滚动事件的元素选择器 (如 ".my-scroll-container")
   */
  targetSelector?: string;

  /**
   * 点击锚点项触发的回调
   * 自动注入 payload.href (string) 和 payload.title (string)
   */
  on_click?: ActionConfig | ActionConfig[];

  /**
   * 监听锚点链接改变的回调
   * 自动注入 payload.currentLink (string)
   */
  on_change?: ActionConfig;
}

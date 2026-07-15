import { BaseComponentConfig, ActionConfig } from '../schema';

export interface AffixComponentConfig extends BaseComponentConfig {
  component: 'affix';
  
  /**
   * 距离窗口顶部达到指定偏移量后触发
   */
  offsetTop?: number;
  
  /**
   * 距离窗口底部达到指定偏移量后触发
   */
  offsetBottom?: number;
  
  /**
   * 设置 Affix 需要监听其滚动事件的元素，此处传入元素的 id 或者选择器 (在 JSON 中配置为 string)
   * FAUI 引擎会在渲染时通过 document.querySelector 查找对应的 DOM
   */
  targetSelector?: string;

  /**
   * 固钉状态改变时触发的回调
   * 自动注入 payload.affixed (boolean) 表示是否处于固定状态
   */
  on_change?: ActionConfig;
}

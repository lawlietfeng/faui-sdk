import type { BaseComponentConfig, ComponentControlValue } from '../schema';

export interface ButtonComponentConfig extends BaseComponentConfig {
  component: 'button';
  label?: string;
  title?: string;
  color?: string;
  disabled?: ComponentControlValue;
  type?: 'primary' | 'dashed' | 'link' | 'text' | 'default';
  danger?: boolean;
  ghost?: boolean;
  shape?: 'default' | 'circle' | 'round';
  size?: 'large' | 'middle' | 'small';
  block?: boolean;
  /** 首次点击立即执行，防抖时间内的重复点击会被忽略并重置倒计时；默认 300ms，配置 0 可关闭。 */
  debounce?: number;
}

import { BaseComponentConfig, ValueBinding, ActionConfig } from '../schema';

export interface TourStepConfig {
  title?: string;
  description?: string;
  target?: string; // CSS 选择器，例如 '#btn-1' 或 '.my-class'
  placement?: 'left' | 'leftTop' | 'leftBottom' | 'right' | 'rightTop' | 'rightBottom' | 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';
  arrow?: boolean | { pointAtCenter: boolean };
  cover?: string; // 图片的 URL，如果有则渲染为 img
}

export interface TourComponentConfig extends BaseComponentConfig {
  component: 'tour';
  
  // 漫游导览特有属性
  open?: ValueBinding | boolean | string;
  current?: ValueBinding;
  steps?: TourStepConfig[] | string;
  
  arrow?: boolean | { pointAtCenter: boolean } | string;
  placement?: string;
  mask?: boolean | { style?: Record<string, string | number>; color?: string } | string;
  type?: 'default' | 'primary' | string;
  zIndex?: number | string;
  
  // 回调动作
  on_close?: ActionConfig;
  on_change?: ActionConfig;
}

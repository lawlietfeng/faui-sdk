import type { BaseComponentConfig } from '../schema';

export interface WatermarkComponentConfig extends BaseComponentConfig {
  component: 'watermark';
  zIndex?: number | string;
  width?: number | string;
  height?: number | string;
  imageWidth?: number | string;
  imageHeight?: number | string;
  font?: { color?: string; fontSize?: number | string; fontWeight?: 'normal' | 'light' | 'weight' | number | string; fontStyle?: 'none' | 'normal' | 'italic' | 'oblique' | string; fontFamily?: string; textAlign?: 'start' | 'end' | 'left' | 'right' | 'center' | string } | string;
  image?: string;
  rotate?: number | string;
  gap?: [number | string, number | string] | string;
  offset?: [number | string, number | string] | string;
}

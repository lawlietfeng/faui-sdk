import type { BaseComponentConfig, ValueBinding } from '../schema';

export interface QrcodeComponentConfig extends BaseComponentConfig {
  component: 'qrcode';
  content?: string;
  value?: ValueBinding;
  errorLevel?: 'L' | 'M' | 'Q' | 'H' | string;
  iconSize?: number | string;
  bordered?: boolean | string;
  color?: string;
  icon?: string;
}

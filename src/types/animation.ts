export type AnimationPreset =
  | 'fade'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'zoom'
  | 'none';

export interface AnimationConfig {
  preset?: AnimationPreset;
  duration?: number;
  delay?: number;
  easing?: string;
  spring?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
  layout?: boolean;
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  exit?: Record<string, unknown>;
}

import { useState, useEffect } from 'react';
import type { AnimationPreset, AnimationConfig } from '../types/animation';

type MotionModule = typeof import('framer-motion');

let motionModule: MotionModule | null = null;
let motionPromise: Promise<MotionModule | null> | null = null;

function loadMotion(): Promise<MotionModule | null> {
  if (motionModule) return Promise.resolve(motionModule);
  if (!motionPromise) {
    motionPromise = import('framer-motion')
      .then((mod) => {
        motionModule = mod;
        return mod;
      })
      .catch(() => {
        motionPromise = null;
        return null;
      });
  }
  return motionPromise;
}

const PRESETS: Record<AnimationPreset, {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit: Record<string, any>;
} | null> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.85 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.85 },
  },
  none: null,
};

export interface ResolvedAnimation {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit: Record<string, any>;
  transition: Record<string, any>;
  layout?: boolean;
}

export function resolveAnimation(
  config: AnimationPreset | AnimationConfig,
): ResolvedAnimation | null {
  if (typeof config === 'string') {
    const preset = PRESETS[config];
    if (!preset) return null;
    return { ...preset, transition: { duration: 0.3 } };
  }

  if (config.preset === 'none') return null;

  const preset = config.preset ? PRESETS[config.preset] : null;
  const initial = config.initial ?? preset?.initial ?? { opacity: 0 };
  const animate = config.animate ?? preset?.animate ?? { opacity: 1 };
  const exit = config.exit ?? preset?.exit ?? { opacity: 0 };

  let transition: Record<string, unknown>;
  if (config.spring) {
    transition = { type: 'spring', ...config.spring };
  } else {
    transition = { duration: config.duration ?? 0.3 };
    if (config.easing) transition.ease = config.easing;
  }
  if (config.delay) transition.delay = config.delay;

  return {
    initial,
    animate,
    exit,
    transition,
    layout: config.layout,
  };
}

export interface UseMotionResult {
  motion: MotionModule['motion'] | null;
  AnimatePresence: MotionModule['AnimatePresence'] | null;
  LayoutGroup: MotionModule['LayoutGroup'] | null;
  isReady: boolean;
}

export function useMotion(): UseMotionResult {
  const [mod, setMod] = useState<MotionModule | null>(motionModule);

  useEffect(() => {
    if (mod) return;
    let cancelled = false;
    loadMotion().then((m) => {
      if (!cancelled && m) setMod(m);
    });
    return () => { cancelled = true; };
  }, [mod]);

  if (!mod) {
    return { motion: null, AnimatePresence: null, LayoutGroup: null, isReady: false };
  }

  return {
    motion: mod.motion,
    AnimatePresence: mod.AnimatePresence,
    LayoutGroup: mod.LayoutGroup,
    isReady: true,
  };
}

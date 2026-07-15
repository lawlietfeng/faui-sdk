import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Statistic as AntdStatistic } from 'antd';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';

function useCountUp(
  target: number,
  duration: number,
  enabled: boolean
): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return enabled ? current : target;
}

export const Statistic: React.FC<ComponentProps<'statistic'>> = ({ config }) => {
  const { value } = config;

  const boundValue = useDataSelector(value?.path);
  const evaluatedContent = useExpression(config.content);
  const displayValue = boundValue !== undefined ? boundValue : evaluatedContent;

  const evaluatedTitle = useExpression(config.title) as React.ReactNode;
  const evaluatedPrefix = useExpression(config.prefix) as React.ReactNode;
  const evaluatedSuffix = useExpression(config.suffix) as React.ReactNode;
  const evaluatedValueStyle = useExpression(config.valueStyle) as React.CSSProperties | undefined;
  const evaluatedPrecision = useExpression(config.precision) as number | undefined;
  const evaluatedIsCountdown = useExpression(config.isCountdown) as boolean | undefined;
  const evaluatedStyle = useExpression(config.style) as React.CSSProperties | undefined;
  const evaluatedClassName = useExpression(config.className) as string | undefined;
  const evaluatedFormat = useExpression(config.format) as string | undefined;
  const evaluatedCountUp = useExpression(config.countUp) as boolean | number | undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting) setVisible(true);
  }, []);

  useEffect(() => {
    if (!evaluatedCountUp || !containerRef.current) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.3 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [evaluatedCountUp, handleIntersect]);

  const countUpEnabled = !!evaluatedCountUp;
  const countUpDuration = typeof evaluatedCountUp === 'number' ? evaluatedCountUp : 1500;

  const rawStr = String(displayValue ?? '');
  const numericMatch = rawStr.match(/^(\d+)/);
  const numericTarget = numericMatch ? parseInt(numericMatch[1], 10) : 0;
  const textSuffix = numericMatch ? rawStr.slice(numericMatch[0].length) : '';

  const animatedNum = useCountUp(numericTarget, countUpDuration, countUpEnabled && visible);
  const finalValue = countUpEnabled
    ? `${animatedNum}${textSuffix}`
    : displayValue;

  if (evaluatedIsCountdown) {
    return (
      <AntdStatistic.Timer
        type="countdown"
        title={evaluatedTitle}
        value={displayValue as any}
        format={evaluatedFormat}
        prefix={evaluatedPrefix}
        suffix={evaluatedSuffix}
        styles={evaluatedValueStyle ? { content: evaluatedValueStyle } : undefined}
        style={evaluatedStyle}
        className={evaluatedClassName}
      />
    );
  }

  return (
    <div ref={containerRef}>
      <AntdStatistic
        title={evaluatedTitle}
        value={finalValue as any}
        precision={evaluatedPrecision}
        prefix={evaluatedPrefix}
        suffix={evaluatedSuffix}
        styles={evaluatedValueStyle ? { content: evaluatedValueStyle } : undefined}
        style={evaluatedStyle}
        className={evaluatedClassName}
      />
    </div>
  );
};

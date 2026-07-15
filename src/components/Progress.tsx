import React from 'react';
import { Progress as AntProgress } from 'antd';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';

export const Progress: React.FC<ComponentProps<'progress'>> = ({ config }) => {
  const percent = Number(useExpression(config.percent)) || 0;
  const status = useExpression(config.status) as string | undefined;
  const size = useExpression(config.size);
  const style = useExpression(config.style) as React.CSSProperties;
  const className = useExpression(config.className) as string;

  const mapStatus = (s?: string): 'success' | 'exception' | 'normal' | 'active' | undefined => {
    if (s === 'error') return 'exception'; // 兼容通用的 error
    if (s === 'success' || s === 'exception' || s === 'normal' || s === 'active') {
      return s;
    }
    return undefined;
  };

  return (
    <AntProgress
      percent={percent}
      status={mapStatus(status)}
      size={size === 'small' ? 'small' : 'medium'}
      style={style}
      className={className}
    />
  );
};

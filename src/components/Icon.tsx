import React from 'react';
import * as Icons from '@ant-design/icons';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';



export const Icon: React.FC<ComponentProps<'icon'>> = ({ config }) => {
  const {
    icon,
    value,
    spin,
    rotate,
    style,
    className,
  } = config;

  // 支持通过 value.path 动态绑定图标名称
  const boundValue = useDataSelector<string>(value?.path);
  const displayIconName = boundValue !== undefined ? boundValue : icon;

  if (!displayIconName || typeof displayIconName !== 'string') {
    return null;
  }

  const IconComponent = (Icons as any)[displayIconName];

  if (!IconComponent) {
    console.warn(`Icon ${displayIconName} not found in @ant-design/icons`);
    return null;
  }

  return (
    <IconComponent
      spin={spin}
      rotate={rotate}
      style={style as React.CSSProperties}
      className={className}
    />
  );
};

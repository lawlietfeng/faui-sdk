import React from 'react';
import { Divider as AntDivider } from 'antd';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';

export const Divider: React.FC<ComponentProps<'divider'>> = ({ config }) => {
  const { direction = 'horizontal', content, align, style, className } = config;
  const evaluatedContent = useExpression(content);

  return (
    <AntDivider
      orientation={direction === 'horizontal' ? 'horizontal' : 'vertical'}
      titlePlacement={align}
      style={style}
      className={className}
    >
      {evaluatedContent}
    </AntDivider>
  );
};

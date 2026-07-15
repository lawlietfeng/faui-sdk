import React from 'react';
import { Tag as AntdTag } from 'antd';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';

export const Tag: React.FC<ComponentProps<'tag'>> = ({ config }) => {
  const { color, content, label, style, className } = config;

  const evaluatedContent = useExpression(content || label);
  const evaluatedColor = useExpression(color) as string | undefined;
  const evaluatedVariant = config.bordered === false ? 'filled' : undefined;

  return (
    <AntdTag
      color={evaluatedColor}
      variant={evaluatedVariant as any}
      style={style}
      className={className}
    >
      {evaluatedContent}
    </AntdTag>
  );
};

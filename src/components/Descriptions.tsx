import React from 'react';
import { Descriptions as AntDescriptions } from 'antd';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';

export const Descriptions: React.FC<ComponentProps<'descriptions'>> = ({ config }) => {
  const { title, bordered = false, column, options = [], style, className } = config;

  const evaluatedTitle = useExpression(title);
  const evaluatedOptions = useExpression(options);

  const items = evaluatedOptions.map((opt: any) => ({
    key: opt.value || opt.label,
    label: opt.label,
    children: opt.value,
  }));

  return (
    <AntDescriptions
      title={evaluatedTitle}
      bordered={bordered}
      column={column}
      items={items}
      style={style}
      className={className}
    />
  );
};

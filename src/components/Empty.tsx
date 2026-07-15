import React from 'react';
import { Empty as AntdEmpty } from 'antd';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';



export const Empty: React.FC<ComponentProps<'empty'>> = ({ config, componentMap }) => {
  const {
    children = [],
    image,
    imageStyle,
    description, // schema 中的 description
    content, // 如果没有 description，可以回退使用 content
    style,
    className,
  } = config;

  let imgNode: React.ReactNode = undefined;
  if (image === 'simple') {
    imgNode = AntdEmpty.PRESENTED_IMAGE_SIMPLE;
  } else if (image === 'default') {
    imgNode = AntdEmpty.PRESENTED_IMAGE_DEFAULT;
  } else if (image) {
    imgNode = image;
  }

  const emptyDescription = description !== undefined ? description : content;
  const evaluatedDescription = useExpression(emptyDescription);

  return (
    <AntdEmpty
      image={imgNode}
      styles={imageStyle ? { image: imageStyle as React.CSSProperties } : undefined}
      description={evaluatedDescription}
      style={style as React.CSSProperties}
      className={className}
    >
      {children.map(childId => {
        const childComponent = componentMap.get(childId);
        if (!childComponent) {
          console.warn(`Component not found: ${childId}`);
          return null;
        }
        return (
          <ComponentRenderer
            key={childId}
            component={childComponent}
            componentMap={componentMap}
          />
        );
      })}
    </AntdEmpty>
  );
};

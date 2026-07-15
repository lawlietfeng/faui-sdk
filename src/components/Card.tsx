import React from 'react';
import { Card as AntCard } from 'antd';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';

export const Card: React.FC<ComponentProps<'card'>> = ({ config, componentMap }) => {
  const { title, bordered, variant, size = 'medium', children = [], style, className } = config;

  const evaluatedTitle = useExpression(title);
  const evaluatedStyle = useExpression(style);

  // Backward compatibility for `bordered`
  const finalVariant = variant || (bordered === false ? 'borderless' : 'outlined');

  return (
    <AntCard
      title={evaluatedTitle}
      variant={finalVariant as 'borderless' | 'outlined'}
      size={size as 'medium' | 'small'}
      style={evaluatedStyle as React.CSSProperties}
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
    </AntCard>
  );
};

import React from 'react';
import { Space as AntdSpace, Divider } from 'antd';
import { ComponentRenderer } from '../SchemaRenderer';
import { useExpression } from '../hooks/useExpression';
import type { ComponentProps } from './index';

export const Space: React.FC<ComponentProps<'space'>> = ({ config, componentMap }) => {
  const { children = [] } = config;

  const evaluatedDirection = (useExpression(config.direction) || 'horizontal') as 'horizontal' | 'vertical';
  const evaluatedAlign = useExpression(config.align) as 'start' | 'end' | 'center' | 'baseline' | undefined;
  const evaluatedWrap = useExpression(config.wrap) as boolean | undefined;
  const evaluatedSize = useExpression(config.size) as 'small' | 'middle' | 'large' | number | [number, number] | undefined;
  const evaluatedSplit = useExpression(config.split) as string | undefined;
  const evaluatedStyle = useExpression(config.style) as React.CSSProperties | undefined;
  const evaluatedClassName = useExpression(config.className) as string | undefined;

  // 如果配置了 split，目前只支持通过 Divider 渲染简单的分割线
  const splitNode = evaluatedSplit === 'divider' ? <Divider orientation={evaluatedDirection === 'horizontal' ? 'vertical' : 'horizontal'} /> : undefined;

  return (
    <AntdSpace
      orientation={evaluatedDirection}
      align={evaluatedAlign as any}
      wrap={evaluatedWrap as boolean}
      size={evaluatedSize as any}
      separator={splitNode}
      style={evaluatedStyle as React.CSSProperties}
      className={evaluatedClassName}
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
    </AntdSpace>
  );
};

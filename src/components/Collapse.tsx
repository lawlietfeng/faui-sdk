import React from 'react';
import { Collapse as AntdCollapse } from 'antd';
import type { ComponentProps } from './index';
import { ComponentRenderer } from '../SchemaRenderer';
import { useExpression } from '../hooks/useExpression';

export const Collapse: React.FC<ComponentProps<'collapse'>> = ({ config, componentMap }) => {
  const { options = [], bordered = true, style, className } = config;

  const evaluatedOptions = useExpression(options);

  const items = evaluatedOptions.map((opt: any) => {
    return {
      key: opt.value,
      label: opt.label,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(opt.children || []).map((childId: string) => {
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
        </div>
      ),
    };
  });

  return (
    <AntdCollapse
      items={items}
      bordered={bordered}
      style={style}
      className={className}
    />
  );
};

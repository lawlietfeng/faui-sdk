import React from 'react';
import { RendererContextScope, useRendererContext } from '../context/RendererContext';
import { ComponentRenderer } from '../SchemaRenderer';
import { useDataSelector } from '../hooks/useDataSelector';
import type { ComponentProps } from './index';



export const List: React.FC<ComponentProps<'list'>> = ({ config, componentMap }) => {
  const { dataModel } = useRendererContext();

  const path = config.data?.path;
  const rawData = useDataSelector(path);
  const data = path ? rawData : [];

  const templateChildren = config.children || [];

  if (!Array.isArray(data)) {
    console.warn('List data is not an array:', data);
    return null;
  }

  return (
    <div style={config.style} className={config.className}>
      {data.map((item, index) => {
        const scopePath = path ? `${path}/${index}` : undefined;
        return (
          <RendererContextScope key={index} $current={item} $parent={dataModel} $scopePath={scopePath}>
            <div style={{ display: 'contents' }}>
              {templateChildren.map(childId => {
                const childComponent = componentMap.get(childId);
                if (!childComponent) return null;
                return (
                  <ComponentRenderer
                    key={`${index}-${childId}`}
                    component={childComponent}
                    componentMap={componentMap}
                  />
                );
              })}
            </div>
          </RendererContextScope>
        );
      })}
    </div>
  );
};

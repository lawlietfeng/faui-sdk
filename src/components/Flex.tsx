import React from 'react';
import { Flex as AntdFlex } from 'antd';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';



export const Flex: React.FC<ComponentProps<'flex'>> = ({ config, componentMap }) => {
  const {
    children = [],
    vertical,
    wrap,
    gap,
    flex,
    align,
    justify,
    style,
    className,
  } = config;

  return (
    <AntdFlex
      id={config.domId}
      vertical={vertical}
      wrap={wrap as React.CSSProperties['flexWrap'] | boolean}
      gap={gap}
      flex={flex}
      align={align}
      justify={justify}
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
    </AntdFlex>
  );
};

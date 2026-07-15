import React from 'react';
import { Row as AntdRow, Col as AntdCol } from 'antd';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';

export const Row: React.FC<ComponentProps<'row'>> = ({ config, componentMap }) => {
  const {
    children = [],
    align,
    justify,
    wrap,
    gutter,
    style,
    className,
  } = config;

  return (
    <AntdRow
      align={align as any}
      justify={justify as any}
      wrap={wrap as boolean}
      gutter={gutter as any}
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
    </AntdRow>
  );
};

export const Col: React.FC<ComponentProps<'col'>> = ({ config, componentMap }) => {
  const {
    children = [],
    span,
    offset,
    push,
    pull,
    order,
    flex,
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
    style,
    className,
  } = config;

  return (
    <AntdCol
      span={span}
      offset={offset}
      push={push}
      pull={pull}
      order={order}
      flex={flex}
      xs={xs as any}
      sm={sm as any}
      md={md as any}
      lg={lg as any}
      xl={xl as any}
      xxl={xxl as any}
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
    </AntdCol>
  );
};

import type { Component } from '../types/schema';
import React from 'react';
import { Layout as AntdLayout } from 'antd';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { useAction } from '../hooks/useAction';
import { resolveOnChange } from '../utils/resolveOnChange';

import { useExpression } from '../hooks/useExpression';

const { Header: AntdHeader, Sider: AntdSider, Content: AntdContent, Footer: AntdFooter } = AntdLayout;



// 渲染子节点的通用函数
const renderChildren = (childrenIds: string[] = [], componentMap: Map<string, Component>) => {
  return childrenIds.map(childId => {
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
  });
};

export const Layout: React.FC<ComponentProps<'layout'>> = ({ config, componentMap }) => {
  const { children, hasSider, style, className, domId } = config;
  const evaluatedStyle = useExpression(style);
  return (
    <AntdLayout id={domId} hasSider={hasSider} style={evaluatedStyle as React.CSSProperties} className={className}>
      {renderChildren(children, componentMap)}
    </AntdLayout>
  );
};

export const Header: React.FC<ComponentProps<'header'>> = ({ config, componentMap }) => {
  const { children, style, className } = config;
  const evaluatedStyle = useExpression(style);
  return (
    <AntdHeader style={evaluatedStyle as React.CSSProperties} className={className}>
      {renderChildren(children, componentMap)}
    </AntdHeader>
  );
};

export const Sider: React.FC<ComponentProps<'sider'>> = ({ config, componentMap }) => {
  const {
    children,
    width,
    collapsible,
    collapsedWidth,
    reverseArrow,
    theme,
    style,
    className,
    value,
    on_change,
  } = config;

  const handleAction = useAction();
  
  // 对于支持折叠的 Sider，通过 dataModel 绑定折叠状态 (boolean)
  const collapsed = useDataSelector<boolean>(value?.path);
  const evaluatedStyle = useExpression(style);
  const evaluatedTheme = useExpression(theme) as 'light' | 'dark' | undefined;

  const onCollapse = (isCollapsed: boolean) => {
    if (on_change) {
      const [resolved, extra] = resolveOnChange(on_change, isCollapsed);
      handleAction.execute(resolved, extra);
    } else if (value?.path) {
      handleAction.execute({ action: 'update_data', path: value.path, value: isCollapsed });
    }
  };

  return (
    <AntdSider
      width={width}
      collapsible={collapsible}
      collapsed={collapsible ? (collapsed as boolean | undefined) : undefined}
      onCollapse={collapsible ? onCollapse : undefined}
      collapsedWidth={collapsedWidth}
      reverseArrow={reverseArrow}
      theme={evaluatedTheme}
      style={evaluatedStyle as React.CSSProperties}
      className={className}
    >
      {renderChildren(children, componentMap)}
    </AntdSider>
  );
};

export const Content: React.FC<ComponentProps<'content'>> = ({ config, componentMap }) => {
  const { children, style, className } = config;
  const evaluatedStyle = useExpression(style);
  return (
    <AntdContent style={evaluatedStyle as React.CSSProperties} className={className}>
      {renderChildren(children, componentMap)}
    </AntdContent>
  );
};

export const Footer: React.FC<ComponentProps<'footer'>> = ({ config, componentMap }) => {
  const { children, style, className } = config;
  const evaluatedStyle = useExpression(style);
  return (
    <AntdFooter style={evaluatedStyle as React.CSSProperties} className={className}>
      {renderChildren(children, componentMap)}
    </AntdFooter>
  );
};

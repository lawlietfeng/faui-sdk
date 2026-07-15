import React from 'react';
import { Tooltip as AntdTooltip } from 'antd';
import { useRendererContext } from '../context/RendererContext';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';

export const Tooltip: React.FC<ComponentProps<'tooltip'>> = ({ config, componentMap }) => {
  const { handleAction } = useRendererContext();

  // 绑定 open 状态
  const openPath = typeof config.open === 'object' ? config.open?.path : undefined;
  const boundOpen = useDataSelector(openPath);
  const isOpen = openPath ? !!boundOpen : (config.open !== undefined ? !!useExpression(config.open) : undefined);

  // 解析配置属性
  const title = useExpression(config.title);
  const placement = useExpression(config.placement);
  const trigger = useExpression(config.trigger);
  const arrow = useExpression(config.arrow);
  const color = useExpression(config.color);

  const handleOpenChange = (newOpen: boolean) => {
    if (config.on_open_change) {
      const actions = Array.isArray(config.on_open_change) ? config.on_open_change : [config.on_open_change];
      actions.forEach(act => handleAction({ ...act, value: newOpen }));
    } else if (openPath) {
      handleAction({
        action: 'update_data',
        path: openPath,
        value: newOpen,
      });
    }
  };

  const tooltipProps: any = {
    title,
    placement,
    trigger,
    arrow,
    color,
    onOpenChange: handleOpenChange,
  };

  if (isOpen !== undefined) {
    tooltipProps.open = isOpen;
  }

  // 获取子组件（触发器）
  const renderChildren = () => {
    if (!config.children || config.children.length === 0) return null;
    
    return config.children.map((childId) => {
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

  return (
    <AntdTooltip {...tooltipProps}>
      {/* 包装一层 span 以确保子节点能正常接收事件 */}
      <span style={config.style as React.CSSProperties} className={config.className ? `faui-trigger-wrap ${config.className}` : 'faui-trigger-wrap'}>
        {renderChildren()}
      </span>
    </AntdTooltip>
  );
};

import React from 'react';
import { Popover as AntdPopover } from 'antd';
import { useAction } from '../hooks/useAction';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';

export const Popover: React.FC<ComponentProps<'popover'>> = ({ config, componentMap }) => {
  const action = useAction();

  // 绑定 open 状态
  const openPath = typeof config.open === 'object' ? config.open?.path : undefined;
  const boundOpen = useDataSelector(openPath);
  const isOpen = openPath ? !!boundOpen : (config.open !== undefined ? !!useExpression(config.open) : undefined);

  // 解析配置属性
  const title = useExpression(config.title);
  const content = useExpression(config.content);
  const placement = useExpression(config.placement);
  const trigger = useExpression(config.trigger);
  const arrow = useExpression(config.arrow);

  const handleOpenChange = (newOpen: boolean) => {
    // 默认回写状态
    if (openPath) {
      action.execute({ action: 'update_data', path: openPath, value: newOpen });
    }
    // 触发自定义回调
    if (config.on_open_change) {
      const actions = Array.isArray(config.on_open_change) ? config.on_open_change : [config.on_open_change];
      actions.forEach(act => action.execute(act));
    }
  };

  const popoverProps: any = {
    title,
    content,
    placement,
    trigger,
    arrow,
    onOpenChange: handleOpenChange,
  };

  if (isOpen !== undefined) {
    popoverProps.open = isOpen;
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
    <AntdPopover {...popoverProps}>
      {/* 包装一层 span 以确保子节点能正常接收事件（防止子节点是纯文本或Fragment时事件绑定失效） */}
      <span style={config.style as React.CSSProperties} className={config.className ? `faui-trigger-wrap ${config.className}` : 'faui-trigger-wrap'}>
        {renderChildren()}
      </span>
    </AntdPopover>
  );
};

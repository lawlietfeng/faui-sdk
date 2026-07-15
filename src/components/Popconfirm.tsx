import React from 'react';
import { Popconfirm as AntdPopconfirm } from 'antd';
import { useAction } from '../hooks/useAction';
import { useExpression } from '../hooks/useExpression';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';

export const Popconfirm: React.FC<ComponentProps<'popconfirm'>> = ({ config, componentMap }) => {
  const action = useAction();

  // 解析配置属性
  const title = useExpression(config.title) || '确定要执行此操作吗？';
  const description = useExpression(config.description);
  const okText = useExpression(config.okText);
  const cancelText = useExpression(config.cancelText);
  const okType = useExpression(config.okType) as 'default' | 'primary' | 'dashed' | 'link' | 'text' | undefined;
  const placement = useExpression(config.placement);
  const disabled = useExpression(config.disabled);

  const handleConfirm = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation(); // 阻止冒泡，特别是在 Table 行点击事件中
    if (config.on_confirm) {
      const actions = Array.isArray(config.on_confirm) ? config.on_confirm : [config.on_confirm];
      actions.forEach(act => action.execute(act));
    }
  };

  const handleCancel = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    if (config.on_cancel) {
      const actions = Array.isArray(config.on_cancel) ? config.on_cancel : [config.on_cancel];
      actions.forEach(act => action.execute(act));
    }
  };

  const popconfirmProps = {
    title,
    description,
    okText,
    cancelText,
    okType,
    placement,
    disabled,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

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
    <AntdPopconfirm {...popconfirmProps}>
      {/* 包装一层 span 以确保子节点能正常接收事件 */}
      <span style={config.style as React.CSSProperties} className={config.className ? `faui-trigger-wrap ${config.className}` : 'faui-trigger-wrap'}>
        {renderChildren()}
      </span>
    </AntdPopconfirm>
  );
};

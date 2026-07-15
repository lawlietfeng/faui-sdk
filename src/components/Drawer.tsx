import React from 'react';
import { Drawer as AntdDrawer } from 'antd';
import { useAction } from '../hooks/useAction';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';

export const Drawer: React.FC<ComponentProps<'drawer'>> = ({ config, componentMap }) => {
  const action = useAction();

  // 绑定 open 状态
  const openPath = typeof config.open === 'object' ? config.open?.path : undefined;
  const boundOpen = useDataSelector(openPath);
  const isOpen = openPath ? !!boundOpen : !!useExpression(config.open);

  // 解析配置属性
  const title = useExpression(config.title);
  const placement = useExpression(config.placement);
  const width = useExpression(config.width);
  const height = useExpression(config.height);
  const closable = useExpression(config.closable);
  const destroyOnHidden = useExpression(config.destroyOnHidden);
  const keyboard = useExpression(config.keyboard);
  const mask = useExpression(config.mask);
  const maskClosable = useExpression(config.maskClosable);
  const zIndex = useExpression(config.zIndex);
  const extra = useExpression(config.extra);
  const footer = useExpression(config.footer);

  const handleClose = () => {
    // 默认关闭并回写状态
    if (openPath) {
      action.execute({ action: 'update_data', path: openPath, value: false });
    }
    // 触发自定义取消回调
    if (config.on_close) {
      const actions = Array.isArray(config.on_close) ? config.on_close : [config.on_close];
      actions.forEach(act => action.execute(act));
    }
  };

  return (
    <AntdDrawer
      open={isOpen}
      title={title}
      placement={placement as 'top' | 'right' | 'bottom' | 'left' | undefined}
      size={(() => {
        const p = placement as string;
        return (p === 'top' || p === 'bottom') ? height : width;
      })()}
      closable={closable}
      destroyOnHidden={destroyOnHidden as boolean}
      keyboard={keyboard}
      mask={(() => {
        if (mask === false) return false;
        if (maskClosable !== undefined) return { closable: maskClosable as boolean };
        return undefined;
      })()}
      zIndex={zIndex}
      onClose={handleClose}
      extra={extra}
      footer={footer}
      style={config.style as React.CSSProperties}
      className={config.className}
    >
      {config.children?.map((childId) => {
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
    </AntdDrawer>
  );
};

import React from 'react';
import { Modal as AntdModal } from 'antd';
import { useAction } from '../hooks/useAction';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';

export const Modal: React.FC<ComponentProps<'modal'>> = ({ config, componentMap }) => {
  const action = useAction();

  // 绑定 open 状态
  const openPath = typeof config.open === 'object' ? config.open?.path : undefined;
  const boundOpen = useDataSelector(openPath);
  const isOpen = openPath ? !!boundOpen : !!useExpression(config.open);

  // 解析配置属性
  const title = useExpression(config.title);
  const cancelText = useExpression(config.cancelText);
  const okText = useExpression(config.okText);
  const okType = useExpression(config.okType) as 'default' | 'primary' | 'dashed' | 'link' | 'text' | undefined;
  const footer = useExpression(config.footer);
  const width = useExpression(config.width);
  const centered = useExpression(config.centered);
  const closable = useExpression(config.closable);
  const destroyOnHidden = useExpression(config.destroyOnHidden);
  const keyboard = useExpression(config.keyboard);
  const mask = useExpression(config.mask);
  const maskClosable = useExpression(config.maskClosable);
  const zIndex = useExpression(config.zIndex);

  const handleCancel = () => {
    // 默认关闭并回写状态
    if (openPath) {
      action.execute({ action: 'update_data', path: openPath, value: false });
    }
    // 触发自定义取消回调
    if (config.on_cancel) {
      const actions = Array.isArray(config.on_cancel) ? config.on_cancel : [config.on_cancel];
      actions.forEach(act => action.execute(act));
    }
  };

  const handleOk = () => {
    // 触发自定义确认回调，如果不配置则默认关闭 Modal
    if (config.on_ok) {
      const actions = Array.isArray(config.on_ok) ? config.on_ok : [config.on_ok];
      actions.forEach(act => action.execute(act));
    } else if (openPath) {
      action.execute({ action: 'update_data', path: openPath, value: false });
    }
  };

  return (
    <AntdModal
      open={isOpen}
      title={title}
      cancelText={cancelText}
      okText={okText}
      okType={okType}
      footer={footer === false || footer === null ? null : undefined}
      width={width}
      centered={centered}
      closable={closable}
      destroyOnHidden={destroyOnHidden as boolean}
      keyboard={keyboard}
      mask={(() => {
        if (mask === false) return false;
        if (maskClosable !== undefined) return { closable: maskClosable as boolean };
        return undefined;
      })()}
      zIndex={zIndex}
      onCancel={handleCancel}
      onOk={handleOk}
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
    </AntdModal>
  );
};

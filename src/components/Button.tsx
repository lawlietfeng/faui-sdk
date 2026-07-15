import React, { useCallback } from 'react';
import { Button as AntButton } from 'antd';
import { useRendererContext } from '../context/RendererContext';
import { useFormContextOptional } from '../context/FormContext';
import { useExpression } from '../hooks/useExpression';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';



export const Button: React.FC<ComponentProps<'button'>> = ({ config, componentMap }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const handleClick = useCallback(async () => {
    if (formContext?.isSubmitButton(config.id)) {
      const passed = await formContext.validateAll();
      if (!passed) {
        return;
      }
    }

    if (config.on_tap) {
      const actions = Array.isArray(config.on_tap) ? config.on_tap : [config.on_tap];
      for (const action of actions) {
        await handleAction(action);
      }
    }
  }, [config.id, config.on_tap, formContext, handleAction]);

  const style = useExpression(config.style || {});
  const evaluatedContent = useExpression(config.content);
  const evaluatedLabel = useExpression(config.label);
  const evaluatedDisabled = useExpression(config.disabled);

  return (
    <AntButton
      onClick={handleClick}
      style={style as React.CSSProperties}
      className={config.className}
      type={config.type as any}
      danger={config.danger}
      ghost={config.ghost}
      shape={config.shape as any}
      size={config.size as any}
      block={config.block}
      disabled={!!evaluatedDisabled}
    >
      {evaluatedContent || evaluatedLabel}
      {(!evaluatedContent && !evaluatedLabel && config.children) ? config.children.map(childId => {
        const childComponent = componentMap.get(childId);
        if (!childComponent) return null;
        return (
          <ComponentRenderer
            key={childId}
            component={childComponent}
            componentMap={componentMap}
          />
        );
      }) : null}
    </AntButton>
  );
};

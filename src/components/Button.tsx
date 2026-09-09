import React, { useCallback, useEffect, useRef } from 'react';
import { Button as AntButton } from 'antd';
import { useRendererContext } from '../context/RendererContext';
import { useFormContextOptional } from '../context/FormContext';
import { useExpression } from '../hooks/useExpression';
import { useBooleanControlValue } from '../hooks/useBooleanControlValue';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';



export const Button: React.FC<ComponentProps<'button'>> = ({ config, componentMap }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeActions = useCallback(async () => {
    if (config.on_tap) {
      const actions = Array.isArray(config.on_tap) ? config.on_tap : [config.on_tap];
      for (const action of actions) {
        await handleAction(action);
      }
    }
  }, [config.on_tap, handleAction]);

  const executeWithDebounce = useCallback(async (action: () => Promise<void>) => {
    const debounce = config.debounce === undefined ? 300 : Math.max(0, config.debounce);
    const pending = debounceTimerRef.current !== null;
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (debounce > 0) {
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
      }, debounce);
      if (pending) return;
    }
    await action();
  }, [config.debounce]);

  useEffect(() => {
    if (!formContext?.isSubmitButton(config.id)) {
      return;
    }
    formContext.registerSubmitHandler(config.id, () => executeWithDebounce(executeActions));
    return () => formContext.unregisterSubmitHandler(config.id);
  }, [config.id, executeActions, executeWithDebounce, formContext]);

  const handleClick = useCallback(async () => {
    if (formContext?.isSubmitButton(config.id)) {
      await formContext.submit(config.id);
      return;
    }
    await executeWithDebounce(executeActions);
  }, [config.id, executeActions, executeWithDebounce, formContext]);

  useEffect(() => () => {
    if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }, []);

  const style = useExpression(config.style || {});
  const evaluatedContent = useExpression(config.content);
  const evaluatedLabel = useExpression(config.label);
  const evaluatedDisabled = useBooleanControlValue(config.disabled);

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
      disabled={evaluatedDisabled}
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

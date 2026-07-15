import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Segmented as AntdSegmented } from 'antd';
import type { Rule } from 'antd/es/form';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useFormContextOptional } from '../context/FormContext';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';
import type { Component } from '../types/schema';

export const Segmented: React.FC<ComponentProps<'segmented'>> = ({ config }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const path = config.value?.path;
  const dataValue = useDataSelector(path);
  const initialValue = path ? dataValue : undefined;
  const [value, setValue] = useState<string | number | undefined>(initialValue as string | number | undefined);
  
  const fieldName = resolveFieldName(config);
  const rules = useMemo(() => normalizeRules(config.rules), [config.rules]);

  // Sync from dataModel
  useEffect(() => {
    if (path) {
      setValue(dataValue as string | number | undefined);
    }
  }, [path, dataValue]);

  // Sync to formContext on value change
  useEffect(() => {
    if (!formContext) return;
    formContext.syncFieldValue(config.id, value ?? '');
  }, [config.id, formContext, value]);

  // Register form field
  useEffect(() => {
    if (!formContext) return;
    formContext.registerField(config.id, {
      name: fieldName,
      rules,
      validateTrigger: config.validateTrigger,
      initialValue: value,
    });
    return () => {
      formContext.unregisterField(config.id);
    };
  }, [config.id, config.validateTrigger, fieldName, formContext, rules]);

  const handleChange = useCallback(
    (newValue: string | number) => {
      setValue(newValue);
      formContext?.syncFieldValue(config.id, newValue);
      void formContext?.validateField(config.id);

      if (config.on_change) {
        const [resolved, extra] = resolveOnChange(config.on_change, newValue);
        handleAction(resolved, extra);
      } else if (path) {
        handleAction({
          action: 'update_data',
          path: path,
          value: newValue,
        });
      }
    },
    [config.id, config.on_change, formContext, handleAction, path]
  );

  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  // Dynamic props resolution
  const evaluatedOptions = (useExpression(config.options) || []) as any[];
  const evaluatedDisabled = useExpression(config.disabled) as boolean | undefined;
  const evaluatedBlock = useExpression(config.block) as boolean | undefined;
  const evaluatedSize = useExpression(config.size) as 'large' | 'middle' | 'small' | undefined;
  const evaluatedStyle = useExpression(config.style) as React.CSSProperties | undefined;
  const evaluatedClassName = useExpression(config.className) as string | undefined;

  return (
    <div style={evaluatedStyle} className={evaluatedClassName}>
      <AntdSegmented
        options={evaluatedOptions}
        value={value}
        onChange={handleChange}
        disabled={evaluatedDisabled}
        block={evaluatedBlock}
        size={evaluatedSize}
      />
      {errorInfo?.help && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{errorInfo.help}</div>
      )}
    </div>
  );
};

function resolveFieldName(config: Component): string {
  if (config.field) return config.field;
  if (config.value?.path) {
    return config.value.path.replace(/^\/+/, '').replace(/\//g, '.');
  }
  return config.id;
}

function normalizeRules(rules?: Component['rules']): Rule[] | undefined {
  if (!rules || rules.length === 0) return undefined;
  return rules.map((rule: any) => ({
    ...rule,
    pattern: rule.pattern ? new RegExp(rule.pattern) : undefined,
  })) as Rule[];
}

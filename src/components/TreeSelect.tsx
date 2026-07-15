import type { Component } from '../types/schema';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { TreeSelect as AntdTreeSelect } from 'antd';
import type { Rule } from 'antd/es/form';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useFormContextOptional } from '../context/FormContext';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';

export const TreeSelect: React.FC<ComponentProps<'treeselect'>> = ({ config }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const path = config.value?.path;
  const dataValue = useDataSelector(path);
  const initialValue = path ? (dataValue as string | string[]) : undefined;
  const [value, setValue] = useState<string | string[] | undefined>(initialValue);
  const fieldName = resolveFieldName(config);
  const rules = useMemo(() => normalizeRules(config.rules), [config.rules]);

  useEffect(() => {
    if (path) {
      const newValue = dataValue as string | string[] | undefined;
      setValue(newValue);
    }
  }, [path, dataValue]);

  useEffect(() => {
    if (!formContext) {
      return;
    }
    formContext.syncFieldValue(config.id, value);
  }, [config.id, formContext, value]);

  useEffect(() => {
    if (!formContext) {
      return;
    }
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

  const handleChange = useCallback((newValue: any) => {
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
  }, [config.id, config.on_change, formContext, handleAction, path]);

  const handleBlur = useCallback(() => {
    void formContext?.validateField(config.id, 'onBlur');
  }, [config.id, formContext]);

  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  const evaluatedPlaceholder = useExpression(config.placeholder) as string | undefined;
  const evaluatedOptions = useExpression(config.options);
  const evaluatedMultiple = useExpression(config.multiple) as boolean | undefined;
  const evaluatedDisabled = useExpression(config.disabled) as boolean | undefined;

  return (
    <div>
      <AntdTreeSelect
        placeholder={evaluatedPlaceholder}
        value={value}
        onChange={handleChange as any}
        onBlur={handleBlur}
        treeData={evaluatedOptions as any[]}
        multiple={evaluatedMultiple}
        treeCheckable={evaluatedMultiple}
        disabled={evaluatedDisabled}
        style={{ width: '100%', ...config.style }}
        className={config.className}
        status={errorInfo?.validateStatus}
      />
      {errorInfo?.help && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{errorInfo.help}</div>
      )}
    </div>
  );
};

function resolveFieldName(config: Component): string {
  if (config.field) {
    return config.field;
  }
  if (config.value?.path) {
    return config.value.path.replace(/^\/+/, '').replace(/\//g, '.');
  }
  return config.id;
}

function normalizeRules(rules?: Component['rules']): Rule[] | undefined {
  if (!rules || rules.length === 0) {
    return undefined;
  }
  return rules.map((rule: any) => ({
    ...rule,
    pattern: rule.pattern ? new RegExp(rule.pattern) : undefined,
  })) as Rule[];
}

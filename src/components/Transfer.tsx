import type { Component } from '../types/schema';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Transfer as AntdTransfer } from 'antd';
import type { Rule } from 'antd/es/form';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useFormContextOptional } from '../context/FormContext';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';

export const Transfer: React.FC<ComponentProps<'transfer'>> = ({ config }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const path = config.value?.path;
  const dataValue = useDataSelector(path);
  const initialValue = path ? (dataValue as string[]) : [];
  const [value, setValue] = useState<string[]>(initialValue || []);
  const fieldName = resolveFieldName(config);
  const rules = useMemo(() => normalizeRules(config.rules), [config.rules]);

  useEffect(() => {
    if (path) {
      const newValue = dataValue as string[];
      setValue(newValue || []);
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

  const handleChange = useCallback((targetKeys: React.Key[]) => {
    const stringKeys = targetKeys.map(String);
    setValue(stringKeys);
    formContext?.syncFieldValue(config.id, stringKeys);
    void formContext?.validateField(config.id);

    if (config.on_change) {
      const [resolved, extra] = resolveOnChange(config.on_change, stringKeys);
      handleAction(resolved, extra);
    } else if (path) {
      handleAction({
        action: 'update_data',
        path,
        value: stringKeys,
      });
    }
  }, [config.id, config.on_change, path, formContext, handleAction]);

  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  const evaluatedOptions = useExpression(config.options);

  const dataSource = useMemo(() => {
    if (!evaluatedOptions) return [];
    return (Array.isArray(evaluatedOptions) ? evaluatedOptions : []).map((opt: any) => ({
      key: String(opt.value),
      title: opt.label,
      description: opt.description,
      disabled: opt.disabled,
    }));
  }, [evaluatedOptions]);

  return (
    <div>
      <AntdTransfer
        dataSource={dataSource}
        targetKeys={value}
        onChange={handleChange}
        render={(item) => item.title ?? ''}
        style={config.style}
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

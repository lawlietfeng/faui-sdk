import type { Component } from '../types/schema';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Checkbox as AntdCheckbox } from 'antd';
import type { Rule } from 'antd/es/form';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useFormContextOptional } from '../context/FormContext';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';

export const Checkbox: React.FC<ComponentProps<'checkbox'>> = ({ config }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const path = config.checked?.path || config.value?.path;
  const dataValue = useDataSelector(path);
  const isGroup = Array.isArray(config.options) && config.options.length > 0;
  
  const initialValue = path 
    ? (isGroup ? (Array.isArray(dataValue) ? dataValue : []) : Boolean(dataValue)) 
    : (isGroup ? [] : false);
    
  const [value, setValue] = useState<any>(initialValue);
  const fieldName = resolveFieldName(config);
  const rules = useMemo(() => normalizeRules(config.rules), [config.rules]);

  useEffect(() => {
    if (path) {
      if (isGroup) {
        setValue(Array.isArray(dataValue) ? dataValue : []);
      } else {
        setValue(Boolean(dataValue));
      }
    }
  }, [path, dataValue, isGroup]);

  useEffect(() => {
    if (!formContext) {
      return;
    }
    formContext.syncFieldValue(config.id, value);
  }, [value, config.id, formContext]);

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
  }, [config.id, config.validateTrigger, fieldName, formContext, rules, value]);

  const handleChange = useCallback((event: { target: { checked: boolean } }) => {
    const newValue = event.target.checked;
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

  const handleGroupChange = useCallback((checkedValues: any[]) => {
    setValue(checkedValues);
    formContext?.syncFieldValue(config.id, checkedValues);
    void formContext?.validateField(config.id);
    if (config.on_change) {
      const [resolved, extra] = resolveOnChange(config.on_change, checkedValues);
      handleAction(resolved, extra);
    } else if (path) {
      handleAction({
        action: 'update_data',
        path: path,
        value: checkedValues,
      });
    }
  }, [config.id, config.on_change, formContext, handleAction, path]);

  const handleBlur = useCallback(() => {
    void formContext?.validateField(config.id, 'onBlur');
  }, [config.id, formContext]);

  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  const evaluatedLabel = useExpression(config.label);
  const evaluatedOptions = useExpression(config.options);
  const options = Array.isArray(evaluatedOptions) ? evaluatedOptions : [];

  if (isGroup) {
    return (
      <div>
        <AntdCheckbox.Group
          options={options as any}
          value={Array.isArray(value) ? value : []}
          onChange={handleGroupChange}
          style={config.style}
          className={config.className}
        />
        {errorInfo?.help && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{errorInfo.help}</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <AntdCheckbox
        name={config.name}
        checked={Boolean(value)}
        onChange={handleChange}
        onBlur={handleBlur}
        style={config.style}
        className={config.className}
      >
        {evaluatedLabel}
      </AntdCheckbox>
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
  if (config.checked?.path) {
    return config.checked.path.replace(/^\/+/, '').replace(/\//g, '.');
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

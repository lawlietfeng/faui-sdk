import type { Component } from '../types/schema';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Switch as AntdSwitch } from 'antd';
import type { Rule } from 'antd/es/form';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import { useFormContextOptional } from '../context/FormContext';
import type { ComponentProps } from './index';

export const Switch: React.FC<ComponentProps<'switch'>> = ({ config }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const path = config.checked?.path || config.value?.path;
  const dataValue = useDataSelector(path);
  const initialValue = path ? Boolean(dataValue) : false;
  const [value, setValue] = useState(initialValue);
  const fieldName = resolveFieldName(config);
  const rules = useMemo(() => normalizeRules(config.rules), [config.rules]);

  useEffect(() => {
    if (path) {
      const newValue = dataValue;
      setValue(Boolean(newValue));
    }
  }, [path, dataValue]);

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

  const handleChange = useCallback((newValue: boolean) => {
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

  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  const evaluatedCheckedChildren = useExpression(config.checkedChildren) as string | undefined;
  const evaluatedUnCheckedChildren = useExpression(config.unCheckedChildren) as string | undefined;
  const evaluatedDisabled = useExpression(config.disabled) as boolean | undefined;
  const evaluatedSize = useExpression(config.size) as 'small' | 'default' | undefined;

  return (
    <div>
      <AntdSwitch
        checked={value}
        onChange={handleChange}
        checkedChildren={evaluatedCheckedChildren}
        unCheckedChildren={evaluatedUnCheckedChildren}
        disabled={evaluatedDisabled}
        size={evaluatedSize}
        style={config.style}
        className={config.className}
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

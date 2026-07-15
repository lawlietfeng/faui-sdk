import type { Component } from '../types/schema';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ColorPicker as AntColorPicker } from 'antd';
import type { Rule } from 'antd/es/form';
import type { Color } from 'antd/es/color-picker';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useFormContextOptional } from '../context/FormContext';
import type { ComponentProps } from './index';



export const ColorPicker: React.FC<ComponentProps<'colorpicker'>> = ({ config }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const path = config.value?.path;
  const dataValue = useDataSelector(path);
  const initialValue = path ? (dataValue as string) : undefined;
  const [value, setValue] = useState<string | undefined>(initialValue);
  const fieldName = resolveFieldName(config);
  const rules = useMemo(() => normalizeRules(config.rules), [config.rules]);

  useEffect(() => {
    if (path) {
      const newValue = dataValue as string | undefined;
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

  const handleChange = useCallback((_color: Color, hexString: string) => {
    setValue(hexString);
    formContext?.syncFieldValue(config.id, hexString);
    void formContext?.validateField(config.id);

    if (config.on_change) {
      const [resolved, extra] = resolveOnChange(config.on_change, hexString);
      handleAction(resolved, extra);
    }
  }, [config.id, config.on_change, formContext, handleAction]);

  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  return (
    <div>
      <AntColorPicker
        value={value}
        onChange={handleChange}
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

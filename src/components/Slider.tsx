import type { Component } from '../types/schema';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Slider as AntSlider } from 'antd';
import type { Rule } from 'antd/es/form';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useFormContextOptional } from '../context/FormContext';
import { useExpression } from '../hooks/useExpression';
import type { ComponentProps } from './index';

export const Slider: React.FC<ComponentProps<'slider'>> = ({ config }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const evaluatedMin = useExpression(config.min) as number | undefined;
  const evaluatedMax = useExpression(config.max) as number | undefined;
  const evaluatedStep = useExpression(config.step) as number | undefined;
  const evaluatedRange = useExpression(config.range) as boolean | undefined;
  const evaluatedDisabled = useExpression(config.disabled) as boolean | undefined;
  const evaluatedStyle = useExpression(config.style) as React.CSSProperties | undefined;
  const evaluatedClassName = useExpression(config.className) as string | undefined;

  const path = config.value?.path;
  const dataValue = useDataSelector(path);
  const initialValue = path ? dataValue : (evaluatedRange ? [0, 0] : 0);
  const [value, setValue] = useState<number | number[]>(initialValue as number | number[]);
  const fieldName = resolveFieldName(config);
  const rules = useMemo(() => normalizeRules(config.rules), [config.rules]);

  useEffect(() => {
    if (path) {
      const newValue = dataValue as number | number[];
      setValue(newValue !== undefined ? newValue : (evaluatedRange ? [0, 0] : 0));
    }
  }, [path, dataValue, evaluatedRange]);

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

  const handleChange = useCallback((newValue: number | number[]) => {
    setValue(newValue);
    formContext?.syncFieldValue(config.id, newValue);
    void formContext?.validateField(config.id);

    if (config.on_change) {
      const [resolved, extra] = resolveOnChange(config.on_change, newValue);
      handleAction(resolved, extra);
    }
  }, [config.id, config.on_change, formContext, handleAction]);

  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  return (
    <div>
      <AntSlider
        range={evaluatedRange as any}
        min={evaluatedMin}
        max={evaluatedMax}
        step={evaluatedStep}
        disabled={evaluatedDisabled}
        value={value as any}
        onChange={handleChange as any}
        style={evaluatedStyle}
        className={evaluatedClassName}
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

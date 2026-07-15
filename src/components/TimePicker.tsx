import type { Component } from '../types/schema';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { TimePicker as AntTimePicker } from 'antd';
import type { Rule } from 'antd/es/form';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import { useFormContextOptional } from '../context/FormContext';
import type { ComponentProps } from './index';

export const TimePicker: React.FC<ComponentProps<'timepicker'>> = ({ config }) => {
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

  const handleChange = useCallback((_time: Dayjs | null, timeString: string | null) => {
    const newValue = timeString || undefined;
    setValue(newValue);
    formContext?.syncFieldValue(config.id, newValue);
    void formContext?.validateField(config.id);

    if (config.on_change) {
      const [resolved, extra] = resolveOnChange(config.on_change, newValue);
      handleAction(resolved, extra);
    } else if (path) {
      handleAction({
        action: 'update_data',
        path,
        value: newValue,
      });
    }
  }, [config.id, config.on_change, path, formContext, handleAction]);

  const handleBlur = useCallback(() => {
    void formContext?.validateField(config.id, 'onBlur');
  }, [config.id, formContext]);

  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  const format = config.format || 'HH:mm:ss';
  const evaluatedPlaceholder = useExpression(config.placeholder) as string | undefined;
  const evaluatedDisabled = useExpression(config.disabled) as boolean | undefined;
  const evaluatedMinuteStep = useExpression(config.minuteStep) as number | undefined;
  const evaluatedSecondStep = useExpression(config.secondStep) as number | undefined;
  const evaluatedHourStep = useExpression(config.hourStep) as number | undefined;
  const dayjsValue = value ? dayjs(value, format) : null;

  return (
    <div>
      <AntTimePicker
        placeholder={evaluatedPlaceholder}
        disabled={evaluatedDisabled}
        minuteStep={evaluatedMinuteStep as any}
        secondStep={evaluatedSecondStep as any}
        hourStep={evaluatedHourStep as any}
        value={dayjsValue}
        onChange={handleChange}
        onBlur={handleBlur}
        format={format}
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

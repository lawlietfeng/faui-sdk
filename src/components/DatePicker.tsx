import type { Component } from '../types/schema';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import type { Rule } from 'antd/es/form';
import dayjs, { type Dayjs } from 'dayjs';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useFormContextOptional } from '../context/FormContext';
import type { ComponentProps } from './index';



export const DatePicker: React.FC<ComponentProps<'datepicker'>> = ({ config }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const path = config.value?.path;
  const dataValue = useDataSelector(path);
  const initialValue = path ? dataValue : null;
  const [value, setValue] = useState(initialValue as string | null);
  const fieldName = resolveFieldName(config);
  const rules = useMemo(() => normalizeRules(config.rules), [config.rules]);

  const beforeDate = useDataSelector(config.disabledDate?.before?.path);
  const afterDate = useDataSelector(config.disabledDate?.after?.path);

  const disabledDate = useCallback((current: Dayjs) => {
    if (!config.disabledDate) return false;

    if (config.disabledDate.before && beforeDate) {
      if (current.isBefore(dayjs(beforeDate as string), 'day')) return true;
    }

    if (config.disabledDate.after && afterDate) {
      if (current.isAfter(dayjs(afterDate as string), 'day')) return true;
    }

    return false;
  }, [config.disabledDate, beforeDate, afterDate]);

  useEffect(() => {
    if (path) {
      const newValue = dataValue;
      setValue((newValue as string) ?? null);
    }
  }, [path, dataValue]);

  useEffect(() => {
    if (!formContext) {
      return;
    }
    formContext.syncFieldValue(config.id, value ?? '');
  }, [config.id, formContext, value]);

  useEffect(() => {
    if (!formContext) {
      return;
    }
    formContext.registerField(config.id, {
      name: fieldName,
      rules,
      validateTrigger: config.validateTrigger,
      initialValue: value ?? '',
    });
    return () => {
      formContext.unregisterField(config.id);
    };
  }, [config.id, config.validateTrigger, fieldName, formContext, rules]);

  const handleChange = useCallback((_date: dayjs.Dayjs | null, dateString: string | null) => {
    const nextValue = dateString ?? '';
    setValue(nextValue);
    formContext?.syncFieldValue(config.id, nextValue);
    void formContext?.validateField(config.id);

    if (config.on_change) {
      const [resolved, extra] = resolveOnChange(config.on_change, nextValue);
      handleAction(resolved, extra);
    } else if (config.value?.path) {
      handleAction({ action: 'update_data', path: config.value.path, value: nextValue });
    }
  }, [config.id, config.on_change, config.value?.path, formContext, handleAction]);

  const handleBlur = useCallback(() => {
    void formContext?.validateField(config.id, 'onBlur');
  }, [config.id, formContext]);

  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  return (
    <div>
      <AntDatePicker
        picker={config.picker || 'date'}
        format={config.format || 'YYYY-MM-DD'}
        showTime={config.showTime || false}
        placeholder={config.placeholder}
        value={value ? dayjs(value) : null}
        onChange={handleChange}
        onBlur={handleBlur}
        disabledDate={config.disabledDate ? disabledDate : undefined}
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

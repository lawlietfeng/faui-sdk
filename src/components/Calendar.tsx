import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar as AntdCalendar } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Rule } from 'antd/es/form';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useFormContextOptional } from '../context/FormContext';
import { useExpression } from '../hooks/useExpression';
import { useBooleanControlValue } from '../hooks/useBooleanControlValue';
import type { ComponentProps } from './index';
import type { Component } from '../types/schema';

export const Calendar: React.FC<ComponentProps<'calendar'>> = ({ config: baseConfig }) => {
  const config = baseConfig as any; // Use as any to bypass strict never type issues internally
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const path = config.value?.path;
  const dataValue = useDataSelector(path);
  const initialValue = path ? dataValue : undefined;
  
  const [value, setValue] = useState<string | undefined>(initialValue as string | undefined);
  const fieldName = resolveFieldName(config);
  const rules = useMemo(() => normalizeRules(config.rules), [config.rules]);
  const evaluatedDisabled = useBooleanControlValue(config.disabled);

  // Sync from dataModel
  useEffect(() => {
    if (path) {
      setValue((dataValue as string) ?? undefined);
    }
  }, [path, dataValue]);

  // Form context sync
  useEffect(() => {
    if (!formContext) return;
    formContext.syncFieldValue(config.id, value ?? '');
  }, [config.id, formContext, value]);

  useEffect(() => {
    if (!formContext) return;
    formContext.registerField(config.id, {
      name: fieldName,
      rules,
      validateTrigger: (config as any).validateTrigger,
      initialValue: value,
    });
    return () => {
      formContext.unregisterField(config.id);
    };
  }, [config.id, config.validateTrigger, fieldName, formContext, rules]);

  // Expression evaluation
  const evaluatedFullscreen = useExpression(config.fullscreen);
  const evaluatedMode = useExpression(config.mode) as 'month' | 'year' | undefined;
  const format = config.format || 'YYYY-MM-DD';
  const disabledDate = useCallback((_current: Dayjs) => evaluatedDisabled === true, [evaluatedDisabled]);

  const onSelect = useCallback(
    (date: Dayjs, selectInfo: { source: 'year' | 'month' | 'date' | 'customize' }) => {
      if (evaluatedDisabled) {
        return;
      }
      const dateString = date.format(format);
      setValue(dateString);
      formContext?.syncFieldValue(config.id, dateString);
      void formContext?.validateField(config.id);

      if (config.on_change) {
        const [resolved, extra] = resolveOnChange(config.on_change, dateString);
        const actions = Array.isArray(resolved) ? resolved : [resolved];
        handleAction(
          actions.map(action => ({
            ...action,
            payload: { ...action.payload, source: selectInfo.source },
          })),
          extra,
        );
      } else if (path) {
        handleAction({
          action: 'update_data',
          path: path,
          value: dateString,
        });
      }
    },
    [config.id, config.on_change, evaluatedDisabled, format, formContext, handleAction, path]
  );

  const onPanelChange = useCallback(
    (date: Dayjs, mode: 'month' | 'year') => {
      if (evaluatedDisabled) {
        return;
      }
      const dateString = date.format(format);
      if (config.on_panel_change) {
        handleAction({
          ...config.on_panel_change,
          value: dateString,
          payload: { mode },
        });
      }
    },
    [config.on_panel_change, evaluatedDisabled, format, handleAction]
  );

  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  return (
    <div
      style={{ ...config.style, pointerEvents: evaluatedDisabled ? 'none' : undefined }}
      className={config.className}
      aria-disabled={evaluatedDisabled}
    >
      <AntdCalendar
        value={value ? dayjs(value, format) : undefined}
        fullscreen={evaluatedFullscreen !== false}
        mode={evaluatedMode}
        onSelect={onSelect}
        onPanelChange={onPanelChange}
        disabledDate={evaluatedDisabled ? disabledDate : undefined}
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

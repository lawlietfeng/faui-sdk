import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Form as AntForm } from 'antd';
import type { FormInstance, Rule } from 'antd/es/form';
import type { ValidateTrigger } from '../types/schema';

interface RegisteredField {
  name: string;
  rules?: Rule[];
  validateTrigger?: ValidateTrigger | ValidateTrigger[];
}

interface FieldErrorInfo {
  validateStatus?: 'error';
  help?: string;
}

export interface FormFieldRegistration {
  name: string;
  rules?: Rule[];
  validateTrigger?: ValidateTrigger | ValidateTrigger[];
  initialValue?: unknown;
}

export interface FormContextValue {
  form: FormInstance;
  registerField: (componentId: string, field: FormFieldRegistration) => void;
  unregisterField: (componentId: string) => void;
  syncFieldValue: (componentId: string, value: unknown) => void;
  validateField: (componentId: string, trigger?: ValidateTrigger) => Promise<boolean>;
  validateAll: () => Promise<boolean>;
  isSubmitButton: (componentId: string) => boolean;
  getFieldErrorInfo: (componentId: string) => FieldErrorInfo;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useFormContextOptional(): FormContextValue | null {
  return useContext(FormContext);
}

interface FormProviderProps {
  submitButtonId?: string;
  children: React.ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ submitButtonId, children }) => {
  const [form] = AntForm.useForm();
  const fieldsRef = useRef<Map<string, RegisteredField>>(new Map());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((componentId: string, message?: string) => {
    setErrors(prev => {
      if (!message) {
        if (!(componentId in prev)) {
          return prev;
        }
        const { [componentId]: _removed, ...rest } = prev;
        return rest;
      }
      if (prev[componentId] === message) {
        return prev;
      }
      return { ...prev, [componentId]: message };
    });
  }, []);

  const registerField = useCallback((componentId: string, field: FormFieldRegistration) => {
    const hasRegistered = fieldsRef.current.has(componentId);
    fieldsRef.current.set(componentId, {
      name: field.name,
      rules: field.rules,
      validateTrigger: field.validateTrigger,
    });

    // 仅首次注册时写入初始值，避免每次重渲染把用户输入与校验状态“重置回去”。
    if (!hasRegistered && field.initialValue !== undefined) {
      form.setFieldValue(field.name, field.initialValue);
    }
  }, [form]);

  const unregisterField = useCallback((componentId: string) => {
    fieldsRef.current.delete(componentId);
  }, []);

  const syncFieldValue = useCallback((componentId: string, value: unknown) => {
    const field = fieldsRef.current.get(componentId);
    if (!field) {
      return;
    }
    form.setFieldValue(field.name, value);
  }, [form]);

  const validateField = useCallback(async (componentId: string, trigger: ValidateTrigger = 'onChange'): Promise<boolean> => {
    const field = fieldsRef.current.get(componentId);
    if (!field) {
      return true;
    }
    const triggers = Array.isArray(field.validateTrigger)
      ? field.validateTrigger
      : field.validateTrigger
        ? [field.validateTrigger]
        : ['onChange'];

    if (!triggers.includes(trigger)) {
      return true;
    }

    const value = form.getFieldValue(field.name);
    const message = getFirstRuleError(value, field.rules);
    if (message) {
      setFieldError(componentId, message);
      return false;
    }
    setFieldError(componentId);
    return true;
  }, [form, setFieldError]);

  const validateAll = useCallback(async (): Promise<boolean> => {
    let allPassed = true;
    for (const [componentId, field] of fieldsRef.current.entries()) {
      const value = form.getFieldValue(field.name);
      const message = getFirstRuleError(value, field.rules);
      if (message) {
        setFieldError(componentId, message);
        allPassed = false;
      } else {
        setFieldError(componentId);
      }
    }
    return allPassed;
  }, [form, setFieldError]);

  const isSubmitButton = useCallback((componentId: string): boolean => {
    return Boolean(submitButtonId) && componentId === submitButtonId;
  }, [submitButtonId]);

  const getFieldErrorInfo = useCallback((componentId: string): FieldErrorInfo => {
    const error = errors[componentId];
    if (!error) {
      return {};
    }
    return {
      validateStatus: 'error',
      help: error,
    };
  }, [errors]);

  const value = useMemo<FormContextValue>(() => ({
    form,
    registerField,
    unregisterField,
    syncFieldValue,
    validateField,
    validateAll,
    isSubmitButton,
    getFieldErrorInfo,
  }), [form, registerField, unregisterField, syncFieldValue, validateField, validateAll, isSubmitButton, getFieldErrorInfo]);

  return (
    <FormContext.Provider value={value}>
      <AntForm form={form} layout="vertical">
        {children}
      </AntForm>
    </FormContext.Provider>
  );
};

function getFirstRuleError(value: unknown, rules?: Rule[]): string | undefined {
  if (!rules || rules.length === 0) {
    return undefined;
  }

  for (const rule of rules) {
    const message = getString(rule, 'message');
    const required = getBoolean(rule, 'required');
    const whitespace = getBoolean(rule, 'whitespace');
    const type = getString(rule, 'type');
    const len = getNumber(rule, 'len');
    const min = getNumber(rule, 'min');
    const max = getNumber(rule, 'max');
    const enumValues = getArray(rule, 'enum');
    const pattern = getRegExp(rule, 'pattern');
    const valueAsString = typeof value === 'string' ? value : '';
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'boolean' && value === false);

    if (required && isEmpty) {
      return toMessage(message, '该字段为必填项');
    }

    if (!isEmpty && whitespace === false && valueAsString.trim().length === 0) {
      return toMessage(message, '该字段不能为空白');
    }

    if (!isEmpty && type && !matchType(type, value)) {
      return toMessage(message, '字段类型不正确');
    }

    if (!isEmpty && typeof len === 'number' && getLength(value) !== len) {
      return toMessage(message, `长度必须为 ${len}`);
    }

    if (!isEmpty && typeof min === 'number') {
      const current = getComparableValue(value);
      if (current < min) {
        return toMessage(message, `最小值/最短长度为 ${min}`);
      }
    }

    if (!isEmpty && typeof max === 'number') {
      const current = getComparableValue(value);
      if (current > max) {
        return toMessage(message, `最大值/最长长度为 ${max}`);
      }
    }

    if (!isEmpty && enumValues && !enumValues.includes(value)) {
      return toMessage(message, '字段值不在允许范围内');
    }

    if (!isEmpty && pattern && !pattern.test(valueAsString)) {
      return toMessage(message, '字段格式不正确');
    }
  }

  return undefined;
}

function toMessage(message: unknown, fallback: string): string {
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  return fallback;
}

function getLength(value: unknown): number {
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length;
  }
  return 0;
}

function getComparableValue(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length;
  }
  return 0;
}

function matchType(type: string, value: unknown): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      return typeof value === 'string' && /^https?:\/\/.+/.test(value);
    default:
      return true;
  }
}

function getRuleObject(rule: Rule): Record<string, unknown> {
  return typeof rule === 'function' ? {} : (rule as unknown as Record<string, unknown>);
}

function getString(rule: Rule, key: string): string | undefined {
  const obj = getRuleObject(rule);
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
}

function getNumber(rule: Rule, key: string): number | undefined {
  const obj = getRuleObject(rule);
  const value = obj[key];
  return typeof value === 'number' ? value : undefined;
}

function getBoolean(rule: Rule, key: string): boolean | undefined {
  const obj = getRuleObject(rule);
  const value = obj[key];
  return typeof value === 'boolean' ? value : undefined;
}

function getArray(rule: Rule, key: string): unknown[] | undefined {
  const obj = getRuleObject(rule);
  const value = obj[key];
  return Array.isArray(value) ? value : undefined;
}

function getRegExp(rule: Rule, key: string): RegExp | undefined {
  const obj = getRuleObject(rule);
  const value = obj[key];
  return value instanceof RegExp ? value : undefined;
}

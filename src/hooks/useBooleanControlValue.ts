import type { ComponentControlValue, ValueBinding } from '../types/schema';
import { useDataSelector } from './useDataSelector';
import { useExpression } from './useExpression';

function isValueBinding(value: ComponentControlValue | undefined): value is ValueBinding {
  return typeof value === 'object' && value !== null && typeof value.path === 'string';
}

/** Resolves a boolean component control from a literal, expression, or data binding. */
export function useBooleanControlValue(value: ComponentControlValue | undefined): boolean | undefined {
  const binding = isValueBinding(value) ? value : undefined;
  const boundValue = useDataSelector<unknown>(binding?.path);
  const evaluatedValue = useExpression(binding ? undefined : value);
  const resolvedValue = binding ? boundValue : evaluatedValue;

  return resolvedValue === undefined || resolvedValue === null
    ? undefined
    : Boolean(resolvedValue);
}

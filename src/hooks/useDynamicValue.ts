import type { ValueBinding } from '../types/schema';
import { useDataSelector } from './useDataSelector';
import { useExpression } from './useExpression';

/**
 * Resolve a value which may be a literal, an expression, or a data binding.
 *
 * A binding is deliberately detected before expression evaluation. This keeps
 * path bindings usable for values which are not boolean controls while leaving
 * the existing expression evaluator responsible for literals and `${...}`
 * expressions.
 */
export function useDynamicValue<T>(value: T): unknown {
  const binding = isValueBinding(value) ? value : undefined;
  const boundValue = useDataSelector(binding?.path);
  const evaluatedValue = useExpression(binding ? undefined : value);

  return binding ? boundValue : evaluatedValue;
}

function isValueBinding(value: unknown): value is ValueBinding {
  return typeof value === 'object'
    && value !== null
    && typeof (value as ValueBinding).path === 'string';
}

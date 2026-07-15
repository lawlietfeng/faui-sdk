import type { ActionConfig, ActionSequence } from '../types/schema';

export function resolveOnChange(
  action: ActionSequence,
  componentValue: unknown,
): [ActionSequence, Record<string, unknown>] {
  const actions = Array.isArray(action) ? action : [action];
  const resolved = actions.map((item: ActionConfig) =>
    item.value !== undefined ? item : { ...item, value: componentValue },
  );
  return [resolved, { $value: componentValue }];
}

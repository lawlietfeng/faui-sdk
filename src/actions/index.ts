import type {
  ActionConfig,
  ActionExecutor,
  ActionRegistry as ActionRegistryType,
} from '../types/schema';
import { updateDataAction } from './updateData';
import { httpProxyAction } from './httpProxy';
import { messageAction } from './message';
import { notificationAction } from './notification';

export { updateDataAction } from './updateData';
export { httpProxyAction } from './httpProxy';
export { messageAction } from './message';
export { notificationAction } from './notification';

export type ActionRegistry = ActionRegistryType;

export const ActionRegistry: ActionRegistryType = {
  update_data: updateDataAction,
  http_proxy: httpProxyAction,
  message: messageAction,
  notification: notificationAction,
};

export async function executeAction(
  action: ActionConfig,
  executor: ActionExecutor
): Promise<void> {
  const handler = ActionRegistry[action.action];

  if (!handler) {
    console.warn(`Unknown action type: ${action.action}`);
    return;
  }

  try {
    const result = await handler(action, executor);

    if (action.on_success) {
      const actions = Array.isArray(action.on_success) ? action.on_success : [action.on_success];
      const ctx = { ...executor, context: { ...executor.context, $result: result } };
      for (const a of actions) {
        await executeAction(a, ctx);
      }
    }
  } catch (error) {
    if (action.on_error) {
      const actions = Array.isArray(action.on_error) ? action.on_error : [action.on_error];
      const msg = error instanceof Error ? error.message : String(error);
      const ctx = { ...executor, context: { ...executor.context, $error: msg } };
      for (const a of actions) {
        await executeAction(a, ctx);
      }
    } else {
      console.error(`Action "${action.action}" failed:`, error);
    }
  }
}

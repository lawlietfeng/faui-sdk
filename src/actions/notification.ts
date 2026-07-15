import { notification } from 'antd';
import type { ActionConfig } from '../types/schema';
import { evaluateExpression } from '../utils/expression';

interface ActionExecutor {
  context: {
    $root: Record<string, unknown>;
    $current?: unknown;
    $parent?: unknown;
    [key: string]: unknown;
  };
}

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'open';

interface NotificationPayload {
  type?: NotificationType;
  message?: unknown;
  description?: unknown;
  duration?: number | null;
  key?: string;
  placement?: 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';
  maxCount?: number;
}

type NotificationApi = Pick<typeof notification, 'success' | 'error' | 'warning' | 'info' | 'open'>;

let notificationApi: NotificationApi | null = null;

export function setNotificationApi(api: NotificationApi | null): void {
  notificationApi = api;
}

export async function notificationAction(
  action: ActionConfig,
  executor: ActionExecutor
): Promise<void> {
  const payload = (action.payload || {}) as NotificationPayload;
  const notificationType: NotificationType = payload.type || 'info';
  const messageValue = evaluateNotificationValue(payload.message, executor);
  const descriptionValue = evaluateNotificationValue(payload.description, executor);

  if (
    (messageValue === null || messageValue === undefined || messageValue === '') &&
    (descriptionValue === null || descriptionValue === undefined || descriptionValue === '')
  ) {
    console.warn('notification action requires payload.message or payload.description');
    return;
  }

  if (typeof payload.maxCount === 'number') {
    notification.config({ maxCount: payload.maxCount });
  }

  const api = notificationApi || notification;
  const open = notificationType === 'open' ? api.open : (api[notificationType] || api.info);

  await open({
    title: messageValue ? String(messageValue) : undefined,
    description: descriptionValue ? String(descriptionValue) : undefined,
    duration: typeof payload.duration === 'number' ? payload.duration : payload.duration === null ? false : undefined,
    key: typeof payload.key === 'string' ? payload.key : undefined,
    placement: payload.placement,
  });
}

function evaluateNotificationValue(value: unknown, executor: ActionExecutor): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return evaluateExpression(value, executor.context);
  }

  if (Array.isArray(value)) {
    return value.map(item => evaluateNotificationValue(item, executor));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = evaluateNotificationValue(v, executor);
    }
    return result;
  }

  return value;
}

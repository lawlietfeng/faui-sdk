import { message } from 'antd';
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

type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface MessagePayload {
  type?: MessageType;
  content?: unknown;
  duration?: number;
  key?: string;
  maxCount?: number;
}

type MessageApi = Pick<typeof message, 'success' | 'error' | 'warning' | 'info' | 'loading' | 'open'>;

let messageApi: MessageApi | null = null;

export function setMessageApi(api: MessageApi | null): void {
  messageApi = api;
}

export async function messageAction(
  action: ActionConfig,
  executor: ActionExecutor
): Promise<void> {
  const payload = (action.payload || {}) as MessagePayload;
  const messageType: MessageType = payload.type || 'info';
  const content = evaluateMessageValue(payload.content, executor);

  if (content === null || content === undefined || content === '') {
    console.warn('message action requires payload.content');
    return;
  }

  if (typeof payload.maxCount === 'number') {
    message.config({ maxCount: payload.maxCount });
  }

  const duration = typeof payload.duration === 'number' ? payload.duration : undefined;
  const key = typeof payload.key === 'string' ? payload.key : undefined;
  const api = messageApi || message;
  const open = api[messageType] || api.info;

  await open({
    content: String(content),
    duration,
    key,
  });
}

function evaluateMessageValue(value: unknown, executor: ActionExecutor): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return evaluateExpression(value, executor.context);
  }

  if (Array.isArray(value)) {
    return value.map(item => evaluateMessageValue(item, executor));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = evaluateMessageValue(v, executor);
    }
    return result;
  }

  return value;
}

import type { ActionConfig, ActionExecutor } from '../types/schema';
import { evaluateExpression } from '../utils/expression';

export interface PostMessagePayload {
  type?: unknown;
  data?: unknown;
  targetOrigin?: unknown;
}

/**
 * 将动作消息发送给嵌入 FAUI 的父窗口。
 *
 * targetOrigin 必须是明确的 HTTP(S) origin，避免把业务数据广播到未知窗口。
 */
export async function postMessageAction(
  action: ActionConfig,
  executor: Pick<ActionExecutor, 'context'>,
): Promise<void> {
  const payload = (action.payload || {}) as PostMessagePayload;
  const type = evaluatePostMessageValue(payload.type, executor.context);
  const data = evaluatePostMessageValue(payload.data, executor.context);
  const targetOrigin = evaluatePostMessageValue(payload.targetOrigin, executor.context);

  if (typeof type !== 'string' || !type.trim()) {
    console.warn('post_message action requires payload.type');
    return;
  }

  if (typeof targetOrigin !== 'string' || !targetOrigin.trim()) {
    console.warn('post_message action requires payload.targetOrigin');
    return;
  }

  const normalizedOrigin = normalizeTargetOrigin(targetOrigin);
  if (!normalizedOrigin) {
    console.warn('post_message action requires a valid HTTP(S) payload.targetOrigin other than "*"');
    return;
  }

  if (typeof window === 'undefined' || typeof window.parent?.postMessage !== 'function') {
    return;
  }

  window.parent.postMessage({ type, data }, normalizedOrigin);
}

function normalizeTargetOrigin(value: string): string | null {
  if (value === '*') {
    return null;
  }

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function evaluatePostMessageValue(value: unknown, context: ActionExecutor['context']): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return evaluateExpression(value, context);
  }

  if (Array.isArray(value)) {
    return value.map(item => evaluatePostMessageValue(item, context));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = evaluatePostMessageValue(item, context);
    }
    return result;
  }

  return value;
}

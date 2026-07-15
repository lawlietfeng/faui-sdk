import type { ActionConfig, HttpRequestConfig } from '../types/schema';
import { evaluateExpression } from '../utils/expression';

export interface ActionExecutor {
  updateData: (path: string, value: unknown) => void;
  getData: (path: string) => unknown;
  httpRequest?: (config: HttpRequestConfig) => Promise<unknown>;
  context: {
    $root: Record<string, unknown>;
    $current?: unknown;
    $parent?: unknown;
  };
}

export async function httpProxyAction(
  action: ActionConfig,
  executor: ActionExecutor
): Promise<unknown> {
  const { payload } = action;

  if (!payload?.http_config) {
    console.warn('http_proxy action requires http_config in payload');
    return;
  }

  const { http_config, http_body } = payload as {
    http_config: { method: string; path: string; headers?: Record<string, string> };
    http_body?: unknown;
  };

  const evaluatedPath = typeof http_config.path === 'string'
    ? String(evaluateExpression(http_config.path, executor.context))
    : http_config.path;

  const config: HttpRequestConfig = {
    method: http_config.method || 'GET',
    url: evaluatedPath,
    headers: http_config.headers || {},
  };

  if (http_body) {
    config.body = evaluateHttpBody(http_body, executor);
  }

  if (!executor.httpRequest) {
    console.warn('httpRequest not provided');
    return;
  }

  return await executor.httpRequest(config);
}

function evaluateHttpBody(body: unknown, executor: ActionExecutor): unknown {
  if (body == null) return body;

  if (typeof body === 'object' && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    if ('path' in obj) {
      return executor.getData(obj.path as string);
    }
  }

  if (typeof body === 'string') {
    return evaluateExpression(body, executor.context);
  }

  if (Array.isArray(body)) {
    return body.map(item => evaluateHttpBody(item, executor));
  }

  if (typeof body === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      result[key] = evaluateHttpBody(value, executor);
    }
    return result;
  }

  return body;
}

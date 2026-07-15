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
    [key: string]: unknown;
  };
}

export async function updateDataAction(
  action: ActionConfig,
  executor: ActionExecutor
): Promise<void> {
  const { path, value } = action;

  if (!path) {
    console.warn('update_data action requires path');
    return;
  }

  const evaluatedValue = evaluateActionValue(value, executor);
  executor.updateData(path, evaluatedValue);
}

function evaluateActionValue(value: unknown, executor: ActionExecutor): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (value === '${value}' || value === '${fileList}') {
      return value;
    }
    return evaluateExpression(value, executor.context);
  }

  if (Array.isArray(value)) {
    return value.map(item => evaluateActionValue(item, executor));
  }

  if (typeof value === 'object') {
    // 兼容 { "$eval": "..." } 这种旧写法的解析
    if ('$eval' in value && typeof (value as any).$eval === 'string') {
      const evalString = (value as any).$eval as string;
      const wrappedExpr = evalString.includes('${') ? evalString : `\${${evalString}}`;
      return evaluateExpression(wrappedExpr, executor.context);
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = evaluateActionValue(v, executor);
    }
    return result;
  }

  return value;
}

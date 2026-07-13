import { isValidElement } from "react";
import type { ExpressionContext } from "../types/schema";

type ExpressionSegment = {
  type: "text" | "expr";
  value: string;
};

const BLOCKED_PROPS = new Set([
  "constructor",
  "__proto__",
  "prototype",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__"
]);

const BLOCKED_GLOBALS = [
  "window",
  "document",
  "globalThis",
  "self",
  "global",
  "process",
  "eval",
  "Function",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "fetch",
  "XMLHttpRequest",
  "importScripts",
  "require",
  "module",
  "exports"
];

const BLOCKED_EXPR_PATTERN = /\b(constructor|__proto__|prototype)\b/;
const VALID_IDENTIFIER_PATTERN = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

const proxyHandler: ProxyHandler<Record<PropertyKey, unknown>> = {
  get(target, prop, receiver) {
    if (typeof prop === "string" && BLOCKED_PROPS.has(prop)) {
      return undefined;
    }

    if (prop === Symbol.toPrimitive || prop === Symbol.iterator) {
      return Reflect.get(target, prop, receiver);
    }

    const value = Reflect.get(target, prop, receiver);
    return sandboxValue(value);
  },
  set() {
    return false;
  },
  deleteProperty() {
    return false;
  }
};

export function evaluateExpression(expression: string, context: ExpressionContext): unknown {
  if (!expression.includes("${")) {
    return expression;
  }

  const segments = parseExpressionSegments(expression);
  if (segments.length === 0) {
    return expression;
  }

  const isPureExpression = segments.length === 1 && segments[0].type === "expr";
  const body = isPureExpression
    ? `(${segments[0].value})`
    : segments
      .map((segment) => (segment.type === "text" ? JSON.stringify(segment.value) : `(${segment.value})`))
      .join("+");

  if (BLOCKED_EXPR_PATTERN.test(body)) {
    console.warn("Expression blocked for security:", expression);
    return expression;
  }

  try {
    const evalContext = createEvalContext(context);
    const fn = new Function(...Object.keys(evalContext), `return (${body})`);
    const safeThis = Object.freeze(Object.create(null));

    return fn.call(safeThis, ...Object.values(evalContext));
  } catch (error) {
    console.error("Expression evaluation error:", error, "Expression:", expression);
    return expression;
  }
}

export function evaluateObject<T>(value: T, context: ExpressionContext): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return evaluateExpression(value, context) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => evaluateObject(item, context)) as T;
  }

  if (typeof value === "object") {
    if (isValidElement(value)) {
      return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      result[key] = evaluateObject(nestedValue, context);
    }

    return result as T;
  }

  return value;
}

function createEvalContext(context: ExpressionContext): Record<string, unknown> {
  const root = toExpressionObject(context.$root);
  const rootVars: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(root)) {
    if (VALID_IDENTIFIER_PATTERN.test(key)) {
      rootVars[key] = sandboxValue(value);
    }
  }

  const { $parent, $current, $root: _root, ...extraContext } = context;
  const evalContext: Record<string, unknown> = {
    $root: sandboxValue(root),
    $parent: sandboxValue(toExpressionObject($parent)),
    $current: sandboxValue(toExpressionObject($current)),
    ...rootVars,
    ...Object.fromEntries(Object.entries(extraContext).map(([key, value]) => [key, sandboxValue(value)])),
    upper: (value: unknown) => String(value).toUpperCase(),
    lower: (value: unknown) => String(value).toLowerCase(),
    isEmpty: (value: unknown) => value == null || value === "" || (Array.isArray(value) && value.length === 0),
    sum: (items: number[]) => items.reduce((total, item) => total + item, 0),
    Math,
    JSON,
    Object,
    String,
    Number,
    Array,
    Date,
    Boolean,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    undefined,
    NaN,
    Infinity
  };

  for (const name of BLOCKED_GLOBALS) {
    if (!(name in evalContext)) {
      evalContext[name] = undefined;
    }
  }

  return evalContext;
}

function sandboxValue(value: unknown): unknown {
  if (value !== null && value !== undefined && typeof value === "object" && !isValidElement(value)) {
    return new Proxy(value as Record<PropertyKey, unknown>, proxyHandler);
  }

  return value;
}

function parseExpressionSegments(input: string): ExpressionSegment[] {
  const segments: ExpressionSegment[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    const start = input.indexOf("${", cursor);
    if (start === -1) {
      if (cursor < input.length) {
        segments.push({ type: "text", value: input.slice(cursor) });
      }
      break;
    }

    if (start > cursor) {
      segments.push({ type: "text", value: input.slice(cursor, start) });
    }

    const end = findExpressionEnd(input, start + 2);
    if (end === -1) {
      return [{ type: "text", value: input }];
    }

    const expr = input.slice(start + 2, end).trim();
    if (!expr) {
      return [{ type: "text", value: input }];
    }

    segments.push({ type: "expr", value: expr });
    cursor = end + 1;
  }

  return segments;
}

function findExpressionEnd(input: string, start: number): number {
  let index = start;
  let braceDepth = 1;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let escaping = false;

  while (index < input.length) {
    const char = input[index];

    if (escaping) {
      escaping = false;
      index += 1;
      continue;
    }

    if (char === "\\") {
      escaping = true;
      index += 1;
      continue;
    }

    if (!inDoubleQuote && !inBacktick && char === "'") {
      inSingleQuote = !inSingleQuote;
      index += 1;
      continue;
    }

    if (!inSingleQuote && !inBacktick && char === "\"") {
      inDoubleQuote = !inDoubleQuote;
      index += 1;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === "`") {
      inBacktick = !inBacktick;
      index += 1;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === "{") {
        braceDepth += 1;
      } else if (char === "}") {
        braceDepth -= 1;
        if (braceDepth === 0) {
          return index;
        }
      }
    }

    index += 1;
  }

  return -1;
}

function toExpressionObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

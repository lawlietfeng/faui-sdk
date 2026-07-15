/**
 * 根据 JSON Pointer 路径获取值
 * path: "/a/b/c" -> data.a.b.c
 */
export function getByPath(data: unknown, path: string): unknown {
  if (!path || typeof path !== 'string' || path === '/') return data;

  const keys = path.split('/').filter(k => k);
  let value: unknown = data;

  for (const key of keys) {
    if (value == null) return undefined;
    value = (value as Record<string, unknown>)[key];
  }

  return value;
}

/**
 * 根据 JSON Pointer 路径设置值（返回新对象）
 */
export function setByPath(data: unknown, path: string, value: unknown): unknown {
  if (!path || typeof path !== 'string' || path === '/') return value;

  const keys = path.split('/').filter(k => k);
  const result = Array.isArray(data) ? [...(data as unknown[])] : { ...(data as Record<string, unknown>) };
  let obj: unknown = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const current = (obj as Record<string, unknown>)[keys[i]];
    (obj as Record<string, unknown>)[keys[i]] = Array.isArray(current)
      ? [...current]
      : { ...(current as Record<string, unknown>) };
    obj = (obj as Record<string, unknown>)[keys[i]];
  }

  (obj as Record<string, unknown>)[keys[keys.length - 1]] = value;
  return result;
}

export type DataStoreListener = () => void;

export interface DataStore<TData = Record<string, unknown>> {
  getSnapshot: () => TData;
  getByPath: <TValue = unknown>(path?: string) => TValue | undefined;
  setByPath: (path: string, value: unknown) => void;
  subscribe: {
    (listener: DataStoreListener): () => void;
    (path: string, listener: DataStoreListener): () => void;
  };
}

type Subscription = {
  path: string | null;
  listener: DataStoreListener;
};

export function createDataStore<TData = Record<string, unknown>>(initialData: TData): DataStore<TData> {
  let snapshot = initialData;
  const subscriptions = new Set<Subscription>();

  const notify = (changedPath: string) => {
    const notified = new Set<DataStoreListener>();

    for (const subscription of subscriptions) {
      if (notified.has(subscription.listener)) {
        continue;
      }

      if (subscription.path === null || isPathAffected(subscription.path, changedPath)) {
        notified.add(subscription.listener);
        subscription.listener();
      }
    }
  };

  const subscribe = (pathOrListener: string | DataStoreListener, maybeListener?: DataStoreListener) => {
    const subscription: Subscription =
      typeof pathOrListener === "function"
        ? { path: null, listener: pathOrListener }
        : { path: normalizeDataPath(pathOrListener), listener: maybeListener as DataStoreListener };

    if (!subscription.listener) {
      return () => undefined;
    }

    subscriptions.add(subscription);

    return () => {
      subscriptions.delete(subscription);
    };
  };

  return {
    getSnapshot: () => snapshot,
    getByPath: (path) => getByPath(snapshot, path),
    setByPath: (path, value) => {
      const normalizedPath = normalizeDataPath(path);
      const previousValue = getByPath(snapshot, normalizedPath);

      if (Object.is(previousValue, value)) {
        return;
      }

      snapshot = setByPath(snapshot, normalizedPath, value);
      notify(normalizedPath);
    },
    subscribe
  };
}

export function getByPath<TValue = unknown>(data: unknown, path?: string): TValue | undefined {
  const segments = getPathSegments(path);

  if (segments.length === 0) {
    return data as TValue;
  }

  let value = data;

  for (const segment of segments) {
    if (value == null) {
      return undefined;
    }

    value = (value as Record<string, unknown>)[segment];
  }

  return value as TValue | undefined;
}

export function setByPath<TData>(data: TData, path: string, value: unknown): TData {
  const segments = getPathSegments(path);

  if (segments.length === 0) {
    return value as TData;
  }

  const root = cloneContainer(data, segments[0]);
  let target = root;
  let source: unknown = data;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    const sourceValue = getContainerValue(source, segment);
    const nextValue = cloneContainer(sourceValue, nextSegment);

    setContainerValue(target, segment, nextValue);
    target = nextValue;
    source = sourceValue;
  }

  setContainerValue(target, segments[segments.length - 1], value);

  return root as TData;
}

export function normalizeDataPath(path?: string): string {
  if (!path || path === "/") {
    return "/";
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  const segments = normalized.split("/").filter(Boolean);

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function getPathSegments(path?: string): string[] {
  const normalizedPath = normalizeDataPath(path);

  if (normalizedPath === "/") {
    return [];
  }

  return normalizedPath.slice(1).split("/").map(decodePathSegment);
}

function decodePathSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function isPathAffected(subscriptionPath: string, changedPath: string): boolean {
  if (subscriptionPath === "/" || changedPath === "/") {
    return true;
  }

  return (
    subscriptionPath === changedPath ||
    subscriptionPath.startsWith(`${changedPath}/`) ||
    changedPath.startsWith(`${subscriptionPath}/`)
  );
}

function cloneContainer(value: unknown, nextSegment?: string): Record<string, unknown> | unknown[] {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (value !== null && typeof value === "object") {
    return { ...(value as Record<string, unknown>) };
  }

  return shouldUseArray(nextSegment) ? [] : {};
}

function shouldUseArray(segment?: string): boolean {
  return Boolean(segment && /^\d+$/.test(segment));
}

function getContainerValue(container: unknown, key: string): unknown {
  if (container == null) {
    return undefined;
  }

  return (container as Record<string, unknown>)[key];
}

function setContainerValue(container: Record<string, unknown> | unknown[], key: string, value: unknown): void {
  (container as Record<string, unknown>)[key] = value;
}

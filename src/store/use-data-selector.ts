import { useCallback, useSyncExternalStore } from "react";
import type { DataStore } from "./create-data-store";

export function useDataSelector<TValue = unknown>(store: DataStore, path?: string): TValue | undefined {
  const getSnapshot = useCallback(() => {
    return path ? store.getByPath<TValue>(path) : undefined;
  }, [path, store]);

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!path) {
        return () => undefined;
      }

      return store.subscribe(path, listener);
    },
    [path, store]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

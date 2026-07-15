import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useRendererContext } from '../context/RendererContext';

export function useDataSelector<T>(path?: string): T | undefined {
  const { getData, subscribeData } = useRendererContext();

  const getSnapshot = useCallback(() => {
    return path ? getData(path) : undefined;
  }, [getData, path]);

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!path) return () => {};
      return subscribeData(path, listener);
    },
    [path, subscribeData]
  );

  const cachedSnapshot = useMemo(() => {
    let lastSnapshotStr = '';
    let lastSnapshotObj: any = null;
    return () => {
      const newSnapshot = getSnapshot();
      let newSnapshotStr;
      try {
        newSnapshotStr = JSON.stringify(newSnapshot);
      } catch {
        newSnapshotStr = String(newSnapshot);
      }
      if (newSnapshotStr !== lastSnapshotStr) {
        lastSnapshotStr = newSnapshotStr;
        lastSnapshotObj = newSnapshot;
      }
      return lastSnapshotObj;
    };
  }, [getSnapshot]);

  return useSyncExternalStore(subscribe, cachedSnapshot, cachedSnapshot) as T;
}

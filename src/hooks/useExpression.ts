import { useMemo, useSyncExternalStore, useCallback, isValidElement } from 'react';
import { evaluateObject } from '../utils/expression';
import { useRendererContext } from '../context/RendererContext';

function hasExpression(obj: unknown): boolean {
  if (typeof obj === 'string') {
    return obj.includes('${');
  }
  if (Array.isArray(obj)) {
    return obj.some(hasExpression);
  }
  if (obj && typeof obj === 'object') {
    if (isValidElement(obj)) {
      return false;
    }
    return Object.values(obj).some(hasExpression);
  }
  return false;
}

export function useExpression<T>(expr: T): T {
  const { getDataModel, subscribeData, $current, $parent } = useRendererContext();

  const needsSubscription = useMemo(() => hasExpression(expr), [expr]);

  const getSnapshot = useCallback(() => {
    const currentDataModel = getDataModel();
    const context = {
      $root: currentDataModel as Record<string, unknown>,
      $current,
      $parent,
    };
    return evaluateObject(expr, context);
  }, [getDataModel, $current, $parent, expr]);

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!needsSubscription) {
        return () => {};
      }
      return subscribeData(listener);
    },
    [needsSubscription, subscribeData]
  );

  // 为了避免每次 getSnapshot 返回新对象导致无限 re-render，
  // 我们可以通过 JSON.stringify 比较，或者在 useSyncExternalStore 中，如果没变化就返回旧的引用。
  // 但是 useSyncExternalStore 内部只用 Object.is() 比较。
  // 所以我们需要缓存 evaluate 的结果！
  
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

  return useSyncExternalStore(subscribe, cachedSnapshot, cachedSnapshot);
}

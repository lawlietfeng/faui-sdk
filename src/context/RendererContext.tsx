import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { DataModel, ActionConfig, ActionSequence, HttpRequestConfig } from '../types/schema';
import type { ComponentRegistry as ComponentRegistryType } from '../components';
import { executeAction } from '../actions';
import { createDataStore, type DataStore } from '../store/create-data-store';

export interface ActionContext {
  $root: DataModel;
  $current: unknown;
  $parent: unknown;
  [key: string]: unknown;
}

export interface RendererContextValue {
  dataModel: DataModel; // 兼容旧版
  getDataModel: () => DataModel;
  updateData: (path: string, value: unknown) => void;
  getData: (path: string) => unknown;
  subscribeData: DataStore<DataModel>['subscribe'];
  componentRegistry: ComponentRegistryType;
  httpRequest?: (config: HttpRequestConfig) => Promise<unknown>;
  onAction?: (action: ActionConfig, context: ActionContext) => void | Promise<void>;
  $current: unknown;
  $parent: unknown;
  $scopePath?: string;
  setCurrent: (item: unknown) => void;
  setParent: (item: unknown) => void;
  handleAction: (action: ActionSequence, extra?: Record<string, unknown>) => Promise<void>;
}

const RendererContext = createContext<RendererContextValue | null>(null);
const EMPTY_DATA: DataModel = {};

export const useRendererContext = (): RendererContextValue => {
  const context = useContext(RendererContext);
  if (!context) {
    throw new Error('useRendererContext must be used within RendererContextProvider');
  }
  return context;
};

interface RendererContextScopeProps {
  $current?: unknown;
  $parent?: unknown;
  $scopePath?: string;
  children: React.ReactNode;
}

export const RendererContextScope: React.FC<RendererContextScopeProps> = ({
  $current,
  $parent,
  $scopePath,
  children,
}) => {
  const parentContext = useRendererContext();
  const scopedCurrent = $current ?? parentContext.$current;
  const scopedParent = $parent ?? parentContext.$parent;
  const scopedPath = $scopePath ?? parentContext.$scopePath;

  const getScopedData = useCallback((path: string): unknown => {
    return parentContext.getData(resolveScopedPath(path, scopedPath));
  }, [parentContext, scopedPath]);

  const updateScopedData = useCallback((path: string, value: unknown): void => {
    parentContext.updateData(resolveScopedPath(path, scopedPath), value);
  }, [parentContext, scopedPath]);

  const handleScopedAction = useCallback(async (action: ActionSequence, extra?: Record<string, unknown>): Promise<void> => {
    const actions = Array.isArray(action) ? action : [action];
    for (const currentAction of actions) {
    const resolvedPath = currentAction.path ? resolveScopedPath(currentAction.path, scopedPath) : currentAction.path;
    const scopedAction = resolvedPath !== currentAction.path
      ? { ...currentAction, path: resolvedPath }
      : currentAction;
    const actionContext: ActionContext = {
      $root: parentContext.dataModel,
      $current: scopedCurrent,
      $parent: scopedParent,
      ...(scopedAction.payload || {}),
      ...(extra || {}),
    };

    if (parentContext.onAction) {
      await parentContext.onAction(scopedAction, actionContext);
    }

    await executeAction(scopedAction, {
      updateData: updateScopedData,
      getData: getScopedData,
      httpRequest: parentContext.httpRequest,
      context: actionContext,
    });
    }
  }, [parentContext, scopedPath, scopedCurrent, scopedParent, updateScopedData, getScopedData]);

  const value = useMemo(() => ({
    ...parentContext,
    getData: getScopedData,
    getDataModel: parentContext.getDataModel,
    updateData: updateScopedData,
    subscribeData: parentContext.subscribeData,
    handleAction: handleScopedAction,
    $current: scopedCurrent,
    $parent: scopedParent,
    $scopePath: scopedPath,
  }), [parentContext, getScopedData, updateScopedData, handleScopedAction, scopedCurrent, scopedParent, scopedPath]);

  return (
    <RendererContext.Provider value={value}>
      {children}
    </RendererContext.Provider>
  );
};

interface RendererContextProviderProps {
  dataModel: DataModel;
  initialData?: DataModel;
  liveData?: DataModel;
  componentRegistry: ComponentRegistryType;
  httpRequest?: (config: HttpRequestConfig) => Promise<unknown>;
  onAction?: (action: ActionConfig, context: ActionContext) => void | Promise<void>;
  children: React.ReactNode;
}

export const RendererContextProvider: React.FC<RendererContextProviderProps> = ({
  dataModel: initialDataModel,
  initialData = EMPTY_DATA,
  liveData,
  componentRegistry,
  httpRequest,
  onAction,
  children,
}) => {
  const storeRef = useRef<DataStore<DataModel>>(
    createDataStore({ ...initialDataModel, ...initialData }),
  );

  const [$current, setCurrent] = useState<unknown>(null);
  const [$parent, setParent] = useState<unknown>(null);

  useEffect(() => {
    storeRef.current.setByPath('/', { ...initialDataModel, ...initialData });
    setCurrent(null);
    setParent(null);
  }, [initialDataModel, initialData]);

  useEffect(() => {
    if (!liveData) return;
    const snapshot = storeRef.current.getSnapshot();
    storeRef.current.setByPath('/', { ...snapshot, ...liveData });
  }, [liveData]);

  const updateData = useCallback((path: string, value: unknown) => {
    storeRef.current.setByPath(path, value);
  }, []);

  const getData = useCallback((path: string): unknown => {
    return storeRef.current.getByPath(path);
  }, []);

  const subscribeData = useCallback<DataStore<DataModel>['subscribe']>(
    ((pathOrListener: string | (() => void), listener?: () => void) =>
      typeof pathOrListener === 'function'
        ? storeRef.current.subscribe(pathOrListener)
        : storeRef.current.subscribe(pathOrListener, listener as () => void)) as DataStore<DataModel>['subscribe'],
    [],
  );

  const handleAction = useCallback(async (action: ActionSequence, extra?: Record<string, unknown>) => {
    const actions = Array.isArray(action) ? action : [action];
    for (const currentAction of actions) {
    const context: ActionContext = {
      $root: storeRef.current.getSnapshot(),
      $current,
      $parent,
      ...(currentAction.payload || {}),
      ...(extra || {}),
    };

    if (onAction) {
      await onAction(currentAction, context);
    }

    await executeAction(currentAction, {
      updateData,
      getData,
      httpRequest,
      context,
    });
    }
  }, [$current, $parent, onAction, updateData, getData, httpRequest]);

  const value = useMemo(() => ({
    // 强制转换为 getters 以获取最新值，但不触发 re-render
    get dataModel() { return storeRef.current.getSnapshot(); },
    getDataModel: () => storeRef.current.getSnapshot(),
    updateData,
    getData,
    subscribeData,
    componentRegistry,
    httpRequest,
    onAction,
    $current,
    $parent,
    $scopePath: undefined,
    setCurrent,
    setParent,
    handleAction,
  }), [updateData, getData, subscribeData, componentRegistry, httpRequest, onAction, $current, $parent, handleAction]);

  return (
    <RendererContext.Provider value={value}>
      {children}
    </RendererContext.Provider>
  );
};

function resolveScopedPath(path: string, scopePath?: string): string {
  if (!scopePath || !path.startsWith('./')) {
    return path;
  }
  const relativePath = path.slice(2).replace(/^\/+/, '');
  if (!relativePath) {
    return scopePath;
  }
  return `${scopePath.replace(/\/+$/, '')}/${relativePath}`;
}

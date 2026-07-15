// Shared core exports (hooks, utils, actions, types, context)
// Used by both form and full entry points

export { SchemaRenderer, ComponentRenderer } from './SchemaRenderer';
export type { SchemaRendererProps } from './SchemaRenderer';

// Renderer (base — requires componentRegistry prop)
export { Renderer as CoreRenderer } from './Renderer';
export type { RendererProps } from './Renderer';

export interface FauiSdkInfo {
  name: string;
  version: string;
}

export interface RendererBootstrapOptions {
  mode?: 'form' | 'full';
}

export const fauiSdkInfo: FauiSdkInfo = {
  name: '@lawlietfeng/faui-sdk',
  version: '0.0.0',
};

export function createRendererBootstrap(
  options: RendererBootstrapOptions = {},
): Required<RendererBootstrapOptions> {
  return { mode: options.mode ?? 'form' };
}

// Context
export { RendererContextProvider, useRendererContext } from './context/RendererContext';
export type { RendererContextValue } from './context/RendererContext';

// Hooks
export { useDataModel } from './hooks/useDataModel';
export { useExpression } from './hooks/useExpression';
export { useAction } from './hooks/useAction';
export { useDataSelector as useRendererDataSelector } from './hooks/useDataSelector';

// Standalone lifecycle and store primitives retained from the SDK baseline.
export * from './lifecycle/apply-activity-deltas';
export * from './lifecycle/use-activity-content';
export * from './store/create-data-store';
export * from './store/use-data-selector';

// Utils
export { evaluateExpression, evaluateObject } from './utils/expression';

// Actions
export { ActionRegistry, executeAction } from './actions';
export { updateDataAction, httpProxyAction, messageAction, notificationAction } from './actions';

// Types
export type * from './types/schema';

export type { AnimationPreset, AnimationConfig } from './types/animation';

// Component utilities
export { registerComponent, createExtendedRegistry } from './components';
export type { ComponentProps } from './components';

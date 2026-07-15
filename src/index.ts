import {
  Renderer as FormRenderer,
  ComponentRegistry as formComponentRegistry,
} from './index.tsx';
import type { ComponentRegistry as ComponentRegistryType } from './types/schema';

export const Renderer = FormRenderer;
export const ComponentRegistry: ComponentRegistryType = formComponentRegistry;
export type ComponentRegistry = ComponentRegistryType;
export * from './core';

// Full Edition entry point
// import { Renderer } from '@lawlietfeng/faui-sdk/full' -> Full Edition

import React, { forwardRef } from 'react';
import { ComponentRegistry as FullRegistry } from './components';
import { Renderer as CoreRenderer, type RendererProps } from './Renderer';
import type { RendererHandle } from './SchemaRenderer';

export * from './core';
export type { RendererProps };

type FullRendererProps = Omit<RendererProps, 'componentRegistry' | 'rendererRef'> & {
  componentRegistry?: RendererProps['componentRegistry'];
};

export const Renderer = forwardRef<RendererHandle, FullRendererProps>(({ componentRegistry, ...props }, ref) => (
  <CoreRenderer rendererRef={ref} componentRegistry={componentRegistry ?? FullRegistry} {...props} />
));

Renderer.displayName = 'FullRenderer';

export { FullRegistry as ComponentRegistry };
export type { RendererHandle };

// Form Edition entry point (default)
// import { Renderer } from '@lawlietfeng/faui-sdk' -> Form Edition

import React, { forwardRef } from 'react';
import { FormComponentRegistry } from './components/formRegistry';
import { Renderer as CoreRenderer, type RendererProps } from './Renderer';
import type { RendererHandle } from './SchemaRenderer';

export * from './core';
export type { RendererProps };

type FormRendererProps = Omit<RendererProps, 'componentRegistry' | 'rendererRef'> & {
  componentRegistry?: RendererProps['componentRegistry'];
};

export const Renderer = forwardRef<RendererHandle, FormRendererProps>(({ componentRegistry, ...props }, ref) => (
  <CoreRenderer rendererRef={ref} componentRegistry={componentRegistry ?? FormComponentRegistry} {...props} />
));

Renderer.displayName = 'FormRenderer';

export { FormComponentRegistry as ComponentRegistry };
export type { RendererHandle };

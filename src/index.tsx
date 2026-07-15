// Form Edition entry point (default)
// import { Renderer } from '@lawlietfeng/faui-sdk' -> Form Edition

import React from 'react';
import { FormComponentRegistry } from './components/formRegistry';
import { Renderer as CoreRenderer, type RendererProps } from './Renderer';

export * from './core';
export type { RendererProps };

type FormRendererProps = Omit<RendererProps, 'componentRegistry'> & {
  componentRegistry?: RendererProps['componentRegistry'];
};

export const Renderer: React.FC<FormRendererProps> = ({ componentRegistry, ...props }) => (
  <CoreRenderer componentRegistry={componentRegistry ?? FormComponentRegistry} {...props} />
);

export { FormComponentRegistry as ComponentRegistry };

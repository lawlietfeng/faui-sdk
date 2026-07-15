// Full Edition entry point
// import { Renderer } from '@lawlietfeng/faui-sdk/full' -> Full Edition

import React from 'react';
import { ComponentRegistry as FullRegistry } from './components';
import { Renderer as CoreRenderer, type RendererProps } from './Renderer';

export * from './core';
export type { RendererProps };

type FullRendererProps = Omit<RendererProps, 'componentRegistry'> & {
  componentRegistry?: RendererProps['componentRegistry'];
};

export const Renderer: React.FC<FullRendererProps> = ({ componentRegistry, ...props }) => (
  <CoreRenderer componentRegistry={componentRegistry ?? FullRegistry} {...props} />
);

export { FullRegistry as ComponentRegistry };

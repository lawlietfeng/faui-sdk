import React from 'react';
import type { Activity } from './types/schema';
import { SchemaRenderer, type SchemaRendererProps } from './SchemaRenderer';
import { useActivityContent } from './lifecycle/use-activity-content';

export interface RendererProps extends Omit<SchemaRendererProps, 'schema'> {
  schema: Activity[];
}

export const Renderer: React.FC<RendererProps> = ({
  schema,
  ...schemaRendererProps
}) => {
  const result = useActivityContent(schema);

  if (!result.ok) {
    return <div>Invalid schema: {result.errors[0]?.message ?? 'activity processing failed'}</div>;
  }

  return (
    <SchemaRenderer
      schema={result.content}
      {...schemaRendererProps}
    />
  );
};

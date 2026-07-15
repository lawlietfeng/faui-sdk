import React from 'react';
import { ComponentRenderer } from '../SchemaRenderer';
import { FormProvider } from '../context/FormContext';
import type { ComponentProps } from './index';



export const Form: React.FC<ComponentProps<'form'>> = ({ config, componentMap }) => {
  const children = config.children ?? [];

  return (
    <FormProvider submitButtonId={config.submitButtonId}>
      <div style={config.style as React.CSSProperties} className={config.className}>
        {children.map(childId => {
          const childComponent = componentMap.get(childId);
          if (!childComponent) {
            console.warn(`Component not found: ${childId}`);
            return null;
          }
          return (
            <ComponentRenderer
              key={childId}
              component={childComponent}
              componentMap={componentMap}
            />
          );
        })}
      </div>
    </FormProvider>
  );
};

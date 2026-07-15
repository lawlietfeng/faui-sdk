import React, { useMemo } from 'react';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';

export const Box: React.FC<ComponentProps<'box'>> = ({ config, componentMap }) => {
  const { layout = 'vertical', spacing = 0, padding = 0, align, justify, children = [] } = config;

  const style = useMemo(() => {
    const paddingValue = typeof padding === 'number' ? padding : parseInt(padding as string, 10) || 0;
    return {
      ...(spacing ? { gap: spacing } : {}),
      ...(paddingValue ? { padding: paddingValue } : {}),
      ...(align ? { alignItems: mapAlign(align) } : {}),
      ...(justify ? { justifyContent: mapJustify(justify) } : {}),
      ...config.style,
    } as React.CSSProperties;
  }, [spacing, padding, align, justify, config.style]);

  const fauiClass = layout === 'horizontal' ? 'faui-box-h' : 'faui-box';
  const mergedClassName = config.className ? `${fauiClass} ${config.className}` : fauiClass;

  return (
    <div id={config.domId} style={style} className={mergedClassName}>
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
  );
};

function mapAlign(align: string): React.CSSProperties['alignItems'] {
  const map: Record<string, React.CSSProperties['alignItems']> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  };
  return map[align] || align;
}

function mapJustify(justify: string): React.CSSProperties['justifyContent'] {
  const map: Record<string, React.CSSProperties['justifyContent']> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    'space-between': 'space-between',
    'space-around': 'space-around',
  };
  return map[justify] || justify;
}

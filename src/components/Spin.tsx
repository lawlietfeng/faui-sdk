import React from 'react';
import { Spin as AntSpin } from 'antd';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';

export const Spin: React.FC<ComponentProps<'spin'>> = ({ config, componentMap }) => {
  const { children = [] } = config;

  const evaluatedTip = useExpression(config.tip) as string | undefined;
  const evaluatedSpinning = (useExpression(config.spinning) ?? true) as boolean;
  const evaluatedSize = useExpression(config.size) as 'small' | 'default' | 'large' | undefined;
  const evaluatedStyle = useExpression(config.style) as React.CSSProperties | undefined;
  const evaluatedClassName = useExpression(config.className) as string | undefined;

  const spinSize = evaluatedSize === 'small' || evaluatedSize === 'large' ? evaluatedSize : 'medium';

  return (
    <AntSpin
      spinning={evaluatedSpinning}
      description={evaluatedTip}
      size={spinSize}
      style={evaluatedStyle}
      className={evaluatedClassName}
    >
      {children.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
      ) : null}
    </AntSpin>
  );
};

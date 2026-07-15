import React, { useMemo } from 'react';
import { useExpression } from '../hooks/useExpression';
import type { ComponentProps } from './index';



export const Text: React.FC<ComponentProps<'text'>> = ({ config }) => {
  const content = useExpression(config.content || '');

  const style = useMemo(() => ({
    ...config.style,
  }), [config.style]);

  return (
    <span style={style} className={config.className}>
      {content as string}
    </span>
  );
};

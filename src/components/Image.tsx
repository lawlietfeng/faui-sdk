import React from 'react';
import { Image as AntImage } from 'antd';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';

export const Image: React.FC<ComponentProps<'image'>> = ({ config }) => {
  const { src, alt, preview = false, style, className, data } = config as any;

  const dataValue = useDataSelector<string>(data?.path);
  const imageSrc = dataValue !== undefined ? dataValue : src;
  
  const evaluatedAlt = useExpression(alt);

  return (
    <AntImage
      src={imageSrc}
      alt={evaluatedAlt}
      preview={preview}
      style={style}
      className={className}
    />
  );
};

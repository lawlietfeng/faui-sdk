import React from 'react';
import { Alert as AntAlert } from 'antd';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';

export const Alert: React.FC<ComponentProps<'alert'>> = ({ config }) => {
  const { title, content, description, status, showIcon = true, style, className } = config as any;

  const evaluatedTitle = useExpression(title);
  const evaluatedContent = useExpression(content);
  const evaluatedDescription = useExpression(description);

  const mapStatusToType = (s?: string): 'success' | 'info' | 'warning' | 'error' | undefined => {
    if (s === 'success' || s === 'info' || s === 'warning' || s === 'error') {
      return s;
    }
    return undefined;
  };

  return (
    <AntAlert
      title={evaluatedTitle || evaluatedContent}
      description={evaluatedDescription}
      type={mapStatusToType(status) || 'info'}
      showIcon={showIcon}
      style={style}
      className={className}
    />
  );
};

import React from 'react';
import { Avatar as AntdAvatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';

export const Avatar: React.FC<ComponentProps<'avatar'>> = ({ config }) => {
  const {
    shape,
    size,
    src,
    alt,
    icon,
    content, // 用作文字头像
    style,
    className,
    data, // 可以绑定动态图片地址或文本
  } = config;

  const dataValue = useDataSelector<string>(data?.path);

  // 优先级：动态绑定数据 > 静态 src > 静态 content
  const avatarSrc = (dataValue && dataValue.startsWith('http')) ? dataValue : src;
  const avatarText = (!avatarSrc && dataValue && !dataValue.startsWith('http')) ? dataValue : content;

  // 目前简单支持预置的 icon 字符串 'user'
  const iconNode = icon === 'user' ? <UserOutlined /> : undefined;
  
  const evaluatedText = useExpression(avatarText);

  return (
    <AntdAvatar
      shape={shape as 'circle' | 'square'}
      size={size as any}
      src={avatarSrc}
      alt={alt}
      icon={iconNode}
      style={style as React.CSSProperties}
      className={className}
    >
      {evaluatedText}
    </AntdAvatar>
  );
};

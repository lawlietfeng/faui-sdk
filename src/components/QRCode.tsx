import React from 'react';
import { QRCode as AntdQRCode } from 'antd';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';

export const QRCode: React.FC<ComponentProps<'qrcode'>> = ({ config }) => {
  const { value, content } = config;

  // 使用 value.path 绑定数据
  const boundValue = useDataSelector<string>(value?.path);
  const displayValue = boundValue !== undefined ? boundValue : content;

  // 如果没有 value，QRCode 会报错或者什么也不渲染。
  // antd QRCode 要求 value 必须是 string
  const qrValue = typeof displayValue === 'string' ? displayValue : 'https://ant.design/';

  const evaluatedQrValue = String(useExpression(qrValue));
  const evaluatedIcon = useExpression(config.icon) as string | undefined;
  const evaluatedErrorLevel = useExpression(config.errorLevel) as 'L' | 'M' | 'Q' | 'H' | undefined;
  const evaluatedIconSize = Number(useExpression(config.iconSize)) || undefined;
  const evaluatedBordered = useExpression(config.bordered) as boolean | undefined;
  const evaluatedColor = useExpression(config.color) as string | undefined;
  const evaluatedStyle = useExpression(config.style) as React.CSSProperties | undefined;
  const evaluatedClassName = useExpression(config.className) as string | undefined;

  return (
    <AntdQRCode
      value={evaluatedQrValue}
      icon={evaluatedIcon}
      errorLevel={evaluatedErrorLevel}
      iconSize={evaluatedIconSize}
      bordered={evaluatedBordered}
      color={evaluatedColor}
      style={evaluatedStyle}
      className={evaluatedClassName}
    />
  );
};

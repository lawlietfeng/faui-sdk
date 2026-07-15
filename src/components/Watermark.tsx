import React from 'react';
import { Watermark as AntdWatermark } from 'antd';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { ComponentRenderer } from '../SchemaRenderer';
import { useExpression } from '../hooks/useExpression';

export const Watermark: React.FC<ComponentProps<'watermark'>> = ({ config, componentMap }) => {
  const {
    content, // 用作 watermark 的 text 或者是单字符串
    value,   // 动态绑定 content
    image,
    zIndex,
    width,
    height,
    imageWidth,
    imageHeight,
    rotate,
    gap,
    offset,
    font,
    style,
    className,
    children = [],
  } = config;

  // 支持通过 value.path 绑定文字内容或字符串数组
  const boundValue = useDataSelector<string | string[]>(value?.path);
  const displayContent = boundValue !== undefined ? boundValue : content;

  const evaluatedContent = useExpression(displayContent);
  const evaluatedImage = useExpression(image);
  const evaluatedZIndex = useExpression(zIndex) as number | undefined;
  const evaluatedWidth = useExpression(width) as number | undefined;
  const evaluatedHeight = useExpression(height) as number | undefined;
  const evaluatedImageWidth = useExpression(imageWidth) as number | undefined;
  const evaluatedImageHeight = useExpression(imageHeight) as number | undefined;
  const evaluatedRotate = useExpression(rotate) as number | undefined;
  const evaluatedGap = useExpression(gap);
  const evaluatedOffset = useExpression(offset);
  const evaluatedFont = useExpression(font);

  // 将字符串或者字符串数组转换为 Ant Design 需要的类型
  let watermarkContent: string | string[] | undefined = undefined;
  if (Array.isArray(evaluatedContent)) {
    watermarkContent = evaluatedContent;
  } else if (typeof evaluatedContent === 'string') {
    watermarkContent = evaluatedContent;
  }

  // 格式化 gap 和 offset 数组参数，Ant Design 需要 [number, number]
  const parseNumberArray = (arr: any): [number, number] | undefined => {
    if (Array.isArray(arr) && arr.length >= 2) {
      return [Number(arr[0]), Number(arr[1])];
    }
    return undefined;
  };

  return (
    <AntdWatermark
      content={watermarkContent}
      image={typeof evaluatedImage === 'string' ? evaluatedImage : undefined}
      zIndex={evaluatedZIndex}
      width={typeof evaluatedWidth === 'number' ? evaluatedWidth : (typeof evaluatedImageWidth === 'number' ? evaluatedImageWidth : undefined)}
      height={typeof evaluatedHeight === 'number' ? evaluatedHeight : (typeof evaluatedImageHeight === 'number' ? evaluatedImageHeight : undefined)}
      rotate={evaluatedRotate}
      gap={parseNumberArray(evaluatedGap)}
      offset={parseNumberArray(evaluatedOffset)}
      font={evaluatedFont as any}
      style={style as React.CSSProperties}
      className={className}
    >
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
    </AntdWatermark>
  );
};

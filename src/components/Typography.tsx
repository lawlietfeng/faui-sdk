import React from 'react';
import { Typography as AntdTypography } from 'antd';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { ComponentRenderer } from '../SchemaRenderer';
import { useExpression } from '../hooks/useExpression';

import type { TypographyComponentConfig } from '../types/components/typography';

export const Typography: React.FC<ComponentProps<'typography'>> = ({ config, componentMap }) => {
  const {
    variant = 'text', // 'text' | 'title' | 'paragraph' | 'link'
    type: configType,
    content,
    value,
    textType,
    level,
    disabled,
    mark,
    code,
    keyboard,
    underline,
    delete: del,
    strong,
    italic,
    ellipsis,
    copyable,
    href,
    target,
    style,
    className,
    items,
    children = [],
  } = config as TypographyComponentConfig;

  // Support backward compatibility or alternative schema keys
  const actualVariant = configType || variant;
  const actualTextType = textType || (config as any).color;

  // 支持通过 value.path 绑定文本内容
  const boundValue = useDataSelector<string>((value as any)?.path);
  const displayContent = boundValue !== undefined ? boundValue : content;

  const evaluatedContent = useExpression(displayContent);
  const evaluatedItems = useExpression(items);
  const evaluatedStyle = useExpression(style);
  
  const evaluatedDisabled = useExpression(disabled) as boolean | undefined;
  const evaluatedMark = useExpression(mark) as boolean | undefined;
  const evaluatedCode = useExpression(code) as boolean | undefined;
  const evaluatedKeyboard = useExpression(keyboard) as boolean | undefined;
  const evaluatedUnderline = useExpression(underline) as boolean | undefined;
  const evaluatedDelete = useExpression(del) as boolean | undefined;
  const evaluatedStrong = useExpression(strong) as boolean | undefined;
  const evaluatedItalic = useExpression(italic) as boolean | undefined;
  const evaluatedEllipsis = useExpression(ellipsis);
  const evaluatedCopyable = useExpression(copyable);
  const evaluatedHref = useExpression(href) as string | undefined;
  const evaluatedTarget = useExpression(target) as string | undefined;
  const evaluatedLevel = useExpression(level) as any;

  const commonProps = {
    type: actualTextType as any,
    disabled: evaluatedDisabled,
    mark: evaluatedMark,
    code: evaluatedCode,
    keyboard: evaluatedKeyboard,
    underline: evaluatedUnderline,
    delete: evaluatedDelete,
    strong: evaluatedStrong,
    italic: evaluatedItalic,
    ellipsis: evaluatedEllipsis as any,
    copyable: evaluatedCopyable as any,
    style: evaluatedStyle as React.CSSProperties,
    className,
  };

  // 如果有子节点，需要递归渲染
  const renderChildren = () => {
    if (children.length > 0) {
      return children.map(childId => {
        const childComponent = componentMap.get(childId);
        if (!childComponent) return null;
        return (
          <ComponentRenderer
            key={childId}
            component={childComponent}
            componentMap={componentMap}
          />
        );
      });
    }
    
    if (evaluatedItems && Array.isArray(evaluatedItems) && evaluatedItems.length > 0) {
      return evaluatedItems.map((item: any, index: number) => {
        // Inherit componentMap and wrap as Typography component config
        const itemConfig: TypographyComponentConfig = { 
          component: 'typography',
          ...item, 
          id: item.id || `${(config as any).id}-item-${index}`
        };
        // Use a cast to bypass TS strict checking for recursive component rendering
        const TypographyComp = Typography as any;
        return <TypographyComp key={index} config={itemConfig} componentMap={componentMap} />;
      });
    }
    
    return evaluatedContent;
  };

  switch (actualVariant) {
    case 'title':
      return (
        <AntdTypography.Title {...commonProps} level={evaluatedLevel}>
          {renderChildren()}
        </AntdTypography.Title>
      );
    case 'paragraph':
      return (
        <AntdTypography.Paragraph {...commonProps}>
          {renderChildren()}
        </AntdTypography.Paragraph>
      );
    case 'link':
      return (
        <AntdTypography.Link {...commonProps} href={evaluatedHref} target={evaluatedTarget}>
          {renderChildren()}
        </AntdTypography.Link>
      );
    case 'text':
    default:
      return (
        <AntdTypography.Text {...commonProps}>
          {renderChildren()}
        </AntdTypography.Text>
      );
  }
};

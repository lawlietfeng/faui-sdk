import React from 'react';
import { Skeleton as AntdSkeleton } from 'antd';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { ComponentRenderer } from '../SchemaRenderer';
import { useExpression } from '../hooks/useExpression';

export const Skeleton: React.FC<ComponentProps<'skeleton'>> = ({ config, componentMap }) => {
  const {
    active,
    avatar,
    paragraph,
    round,
    title,
    skeletonType, // 支持 button, avatar, input, image, node
    size,
    shape,
    block,
    visible, // 使用 visible 属性控制骨架屏是否显示，也就是 loading 状态
    style,
    className,
    children = [],
  } = config;

  // 使用 visible.path 绑定 loading 状态（通常为 dataModel 中的布尔值，比如 isLoading）
  // true = 显示骨架屏 (loading)，false = 显示真实子节点内容
  const boundLoading = useDataSelector<boolean>(
    typeof visible === 'object' && visible !== null && 'path' in visible
      ? (visible as any).path
      : undefined
  );

  const isLoading = boundLoading !== undefined 
    ? boundLoading 
    : (typeof visible === 'boolean' ? visible : true); // 默认没有绑定的话，当作 true 显示骨架屏

  const evaluatedTitle = useExpression(title);
  const evaluatedActive = useExpression(active) as boolean | undefined;
  const evaluatedAvatar = useExpression(avatar) as any;
  const evaluatedParagraph = useExpression(paragraph) as any;
  const evaluatedRound = useExpression(round) as boolean | undefined;
  const evaluatedSkeletonType = useExpression(skeletonType) as string | undefined;
  const evaluatedSize = useExpression(size) as any;
  const evaluatedShape = useExpression(shape) as any;
  const evaluatedBlock = useExpression(block) as boolean | undefined;
  const evaluatedStyle = useExpression(style) as React.CSSProperties | undefined;
  const evaluatedClassName = useExpression(className) as string | undefined;

  const renderChildren = () => {
    if (children.length === 0) return undefined;
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
  };

  const commonProps = {
    active: evaluatedActive,
    style: evaluatedStyle,
    className: evaluatedClassName,
  };

  if (evaluatedSkeletonType === 'button') {
    return <AntdSkeleton.Button {...commonProps} size={evaluatedSize} shape={evaluatedShape} block={evaluatedBlock} />;
  }
  if (evaluatedSkeletonType === 'avatar') {
    return <AntdSkeleton.Avatar {...commonProps} size={evaluatedSize} shape={evaluatedShape} />;
  }
  if (evaluatedSkeletonType === 'input') {
    return <AntdSkeleton.Input {...commonProps} size={evaluatedSize} />;
  }
  if (evaluatedSkeletonType === 'image') {
    return <AntdSkeleton.Image {...commonProps} />;
  }
  if (evaluatedSkeletonType === 'node') {
    return <AntdSkeleton.Node {...commonProps} />;
  }

  return (
    <AntdSkeleton
      loading={isLoading}
      active={evaluatedActive}
      avatar={evaluatedAvatar}
      paragraph={evaluatedParagraph}
      round={evaluatedRound}
      title={evaluatedTitle}
      style={evaluatedStyle}
      className={evaluatedClassName}
    >
      {renderChildren()}
    </AntdSkeleton>
  );
};

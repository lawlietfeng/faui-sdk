import React from 'react';
import { Skeleton as AntdSkeleton } from 'antd';
import type { ComponentProps } from './index';
import { ComponentRenderer } from '../SchemaRenderer';
import { useExpression } from '../hooks/useExpression';
import { useDynamicValue } from '../hooks/useDynamicValue';

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
    visible, // 兼容属性：历史上表示 loading
    loading,
    style,
    className,
    children = [],
  } = config;

  // `loading` is the canonical property. `visible` remains a loading alias
  // for compatibility and only applies when loading is omitted.
  const resolvedLoading = useDynamicValue(loading ?? visible ?? true);
  const isLoading = resolvedLoading === undefined || resolvedLoading === null
    ? true
    : Boolean(resolvedLoading);

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

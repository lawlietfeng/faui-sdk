import type { TimelineItemProps } from 'antd';
import React from 'react';
import { Timeline as AntdTimeline } from 'antd';
import type { ComponentProps } from './index';
import { ComponentRenderer } from '../SchemaRenderer';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';

export const Timeline: React.FC<ComponentProps<'timeline'>> = ({ config, componentMap }) => {
  const {
    mode,
    pending,
    reverse,
    items,
    data,
    children = [],
    style,
    className,
  } = config;

  const evaluatedMode = useExpression(mode) as 'left' | 'alternate' | 'right' | undefined;
  const evaluatedPending = useExpression(pending) as React.ReactNode;
  const evaluatedReverse = useExpression(reverse) as boolean | undefined;

  // 使用 data.path 绑定数据
  const boundItems = useDataSelector<TimelineItemProps[]>(data?.path);
  const displayItems = boundItems !== undefined ? boundItems : items;

  let timelineItems: TimelineItemProps[] | undefined = undefined;

  // 如果提供了 displayItems（优先使用绑定数据或静态配置的 items）
  if (displayItems && Array.isArray(displayItems)) {
    timelineItems = displayItems.map((item: any, index) => ({
      key: `timeline-item-${index}`,
      color: item.color,
      title: item.label,
      content: item.content,
      placement: item.position,
    }));
  } 
  // 否则，如果有 children，将 children 作为 timeline 的 item，这样可以支持内部放置复杂组件
  else if (children && children.length > 0) {
    timelineItems = children.map(childId => {
      const childComp = componentMap.get(childId);
      if (!childComp) return null;
      return {
        key: childId,
        color: childComp.color,
        title: childComp.title,
        content: <ComponentRenderer component={childComp} componentMap={componentMap} />
      } as TimelineItemProps;
    }).filter(Boolean) as TimelineItemProps[];
  }

  const evaluatedItems = useExpression(timelineItems);

  const finalItems = (() => {
    const base = (evaluatedItems as any[]) || [];
    if (evaluatedPending) {
      return [...base, { content: evaluatedPending, color: 'gray' }];
    }
    return base;
  })();

  return (
    <AntdTimeline
      mode={evaluatedMode}
      reverse={evaluatedReverse}
      items={finalItems as any}
      style={style as React.CSSProperties}
      className={className}
    />
  );
};

import React from 'react';
import { Badge as AntdBadge } from 'antd';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';



export const Badge: React.FC<ComponentProps<'badge'>> = ({ config, componentMap }) => {
  const {
    children = [],
    count,
    dot,
    overflowCount,
    showZero,
    status,
    color,
    content, // 用作 badge 的 text
    style,
    className,
    data, // 动态绑定 count 数据
  } = config;

  // 如果绑定了 data，则优先使用绑定的数字作为 count
  const dataCount = useDataSelector<number | string>(data?.path);
  const badgeCount = dataCount !== undefined ? dataCount : count;

  const evaluatedContent = useExpression(content);

  return (
    <AntdBadge
      count={badgeCount as React.ReactNode}
      dot={dot}
      overflowCount={overflowCount}
      showZero={showZero}
      status={status as any}
      color={color}
      text={evaluatedContent} // antd 中状态点后面的文本叫 text
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
    </AntdBadge>
  );
};

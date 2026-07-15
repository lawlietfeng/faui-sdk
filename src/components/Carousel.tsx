import React, { useRef, useEffect } from 'react';
import { Carousel as AntdCarousel } from 'antd';
import { CarouselRef } from 'antd/es/carousel';
import { useAction } from '../hooks/useAction';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';

export const Carousel: React.FC<ComponentProps<'carousel'>> = ({ config, componentMap }) => {
  const action = useAction();
  const carouselRef = useRef<CarouselRef>(null);

  // 解析顶层属性
  const autoplay = useExpression(config.autoplay);
  const autoplaySpeed = useExpression(config.autoplaySpeed);
  const dotPlacement = useExpression(config.dotPosition);
  const dots = useExpression(config.dots);
  const effect = useExpression(config.effect);
  const easing = useExpression(config.easing);
  const waitForAnimate = useExpression(config.waitForAnimate);

  // 绑定当前索引状态
  const currentPath = config.current?.path;
  const currentVal = useDataSelector(currentPath);

  // 同步外部状态到内部
  useEffect(() => {
    if (currentVal !== undefined && currentVal !== null) {
      const targetIndex = Number(currentVal);
      if (!isNaN(targetIndex)) {
        carouselRef.current?.goTo(targetIndex, false);
      }
    }
  }, [currentVal]);

  // 解析子节点配置数组
  const parsedItems = useExpression(config.items);

  const handleAfterChange = (current: number) => {
    if (currentPath) {
      action.execute({ action: 'update_data', path: currentPath, value: current });
    }
    if (config.on_change) {
      const [resolved, extra] = resolveOnChange(config.on_change, current);
      action.execute(resolved, extra);
    }
  };

  return (
    <AntdCarousel
      ref={carouselRef}
      style={config.style as React.CSSProperties}
      className={config.className}
      autoplay={autoplay as boolean}
      autoplaySpeed={autoplaySpeed as number}
      dotPlacement={dotPlacement as any}
      dots={dots as boolean}
      effect={effect as any}
      easing={easing as string}
      waitForAnimate={waitForAnimate as boolean}
      afterChange={handleAfterChange}
    >
      {Array.isArray(parsedItems) &&
        parsedItems.map((item, index) => {
          // 这里可以支持子组件的渲染
          const itemKey = item.key || String(index);
          return (
            <div key={itemKey} style={item.style as React.CSSProperties} className={item.className}>
              {Array.isArray(item.children) &&
                item.children.map((childId: string) => {
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
            </div>
          );
        })}
    </AntdCarousel>
  );
};

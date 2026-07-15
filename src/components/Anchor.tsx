import React, { useState, useEffect } from 'react';
import { Anchor as AntdAnchor } from 'antd';
import { ComponentProps } from './index';
import { useAction } from '../hooks/useAction';
import { useExpression } from '../hooks/useExpression';

export const Anchor: React.FC<ComponentProps<'anchor'>> = ({ config }) => {
  const {
    items,
    offsetTop,
    direction = 'vertical',
    affix = true,
    showInkInFixed = true,
    replace = true,
    targetSelector,
    on_click,
    on_change,
    style,
    className
  } = config;

  const { execute } = useAction();
  const evalTargetSelector = useExpression(targetSelector);
  const evalItems = useExpression(items) || [];
  
  const [targetDom, setTargetDom] = useState<HTMLElement | Window | null>(null);

  useEffect(() => {
    // 延迟查找 DOM
    const timer = setTimeout(() => {
      if (evalTargetSelector && typeof evalTargetSelector === 'string') {
        const el = document.querySelector(evalTargetSelector);
        if (el) {
          setTargetDom(el as HTMLElement);
        } else {
          console.warn(`Anchor targetSelector "${evalTargetSelector}" not found in document.`);
        }
      } else {
        // 默认监听 Window
        setTargetDom(window);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [evalTargetSelector]);

  const handleClick = (_e: React.MouseEvent<HTMLElement>, link: { title: React.ReactNode; href: string }) => {
    // We intentionally let Ant Design handle the hash and scrolling by NOT calling preventDefault.
    // e.preventDefault() here actually breaks Antd Anchor's built-in scrollTo mechanism in recent versions.
    if (on_click) {
      const actions = Array.isArray(on_click) ? on_click : [on_click];
      actions.forEach(act => execute({ ...act, payload: { href: link.href, title: typeof link.title === 'string' ? link.title : undefined } }));
    }
  };

  const handleChange = (currentLink: string) => {
    if (on_change) {
      const actions = Array.isArray(on_change) ? on_change : [on_change];
      actions.forEach(act => execute({ ...act, payload: { currentLink } }));
    }
  };

  const targetFunc = targetDom ? () => targetDom : () => window;

  // 递归处理 items，确保使用合法的 title / href / key
  // 方案A：如果 direction 为 horizontal 或 children 为空，则严格剔除 children 键，避免触发 Antd 的报错熔断
  const transformItems = (anchorItems: any[]): any[] => {
    return anchorItems.map(item => {
      const transformedItem: any = {
        key: item.key,
        href: item.href,
        title: item.title,
        target: item.target,
      };

      if (direction !== 'horizontal' && item.children && Array.isArray(item.children) && item.children.length > 0) {
        transformedItem.children = transformItems(item.children);
      }

      return transformedItem;
    });
  };

  // 如果定义了 targetSelector，但是在下一个宏任务（setTimeout）还没有找到 DOM 之前，先不要渲染 Anchor
  // 这是为了防止 AntdAnchor 在出生时错误地绑定到 window 从而导致计算位置永远失效
  if (evalTargetSelector && !targetDom) {
    return <div style={style} className={className} />;
  }

  return (
    <div style={style} className={className}>
      <AntdAnchor
        key={targetDom === window ? 'window' : `dom-${evalTargetSelector}`}
        items={transformItems(evalItems)}
        offsetTop={offsetTop}
        direction={direction}
        affix={affix}
        showInkInFixed={showInkInFixed}
        replace={replace}
        getContainer={targetFunc}
        onClick={handleClick}
        onChange={handleChange}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Affix as AntdAffix } from 'antd';
import { ComponentProps } from './index';
import { ComponentRenderer } from '../SchemaRenderer';
import { useAction } from '../hooks/useAction';
import { useExpression } from '../hooks/useExpression';

export const Affix: React.FC<ComponentProps<'affix'>> = ({ config, componentMap }) => {
  const {
    offsetTop,
    offsetBottom,
    targetSelector,
    on_change,
    children,
    style,
    className
  } = config;

  const { execute } = useAction();
  const evalTargetSelector = useExpression(targetSelector);
  
  // 用于存储动态获取的 target DOM 节点
  const [targetDom, setTargetDom] = useState<HTMLElement | Window | null>(null);

  useEffect(() => {
    // 使用 setTimeout 延迟查找 DOM，因为目标 DOM 可能在同一帧内尚未完全挂载到文档中
    const timer = setTimeout(() => {
      if (evalTargetSelector && typeof evalTargetSelector === 'string') {
        const el = document.querySelector(evalTargetSelector);
        if (el) {
          setTargetDom(el as HTMLElement);
        } else {
          console.warn(`Affix targetSelector "${evalTargetSelector}" not found in document.`);
        }
      } else {
        // 默认监听 Window
        setTargetDom(window);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [evalTargetSelector]);

  const handleChange = (affixed?: boolean) => {
    if (on_change) {
      const actions = Array.isArray(on_change) ? on_change : [on_change];
      actions.forEach(act => execute({ ...act, payload: { affixed } }));
    }
  };

  // 在 targetDom 未初始化完成前先不渲染 Affix（或者默认使用 window）
  // Antd Affix 的 target 属性需要返回 HTMLElement | Window
  const targetFunc = targetDom ? () => targetDom : () => window;

  // 为了触发 target 绑定的重新计算，使用 key 重置组件，这是 antd Affix 改变 target 时的一个常见 workaround
  return (
    <div style={style} className={className}>
      <AntdAffix
        key={targetDom === window ? 'window' : 'dom'}
        offsetTop={offsetTop}
        offsetBottom={offsetBottom}
        target={targetFunc}
        onChange={handleChange}
      >
        <div style={{ display: 'contents' }}>
          {children?.map((childId) => {
            const childComponent = componentMap.get(childId);
            if (!childComponent) return null;
            return (
              <ComponentRenderer
                key={childId}
                component={childComponent}
                componentMap={componentMap}
              />
            );
          })}
        </div>
      </AntdAffix>
    </div>
  );
};

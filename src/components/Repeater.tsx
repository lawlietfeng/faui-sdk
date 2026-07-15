import React from 'react';
import { RendererContextScope } from '../context/RendererContext';
import { ComponentRenderer } from '../SchemaRenderer';
import { useDataSelector } from '../hooks/useDataSelector';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';
import { useMotion, resolveAnimation } from '../utils/animation';

export const Repeater: React.FC<ComponentProps<'repeater'>> = ({ config, componentMap }) => {
  const path = config.data?.path;
  const rawData = useDataSelector(path);
  const items = path ? rawData : [];
  const templateChildren = config.children || [];
  const direction = config.direction ?? 'vertical';
  const gap = config.gap ?? 0;
  const evaluatedStyle = useExpression(config.style) as React.CSSProperties | undefined;
  const evaluatedEmptyContent = useExpression(config.emptyContent) as string | undefined;
  const { motion, AnimatePresence, isReady } = useMotion();
  const resolved = config.animation ? resolveAnimation(config.animation) : null;
  const keyField = config.keyField;

  const getItemKey = (item: any, index: number): string => {
    if (keyField && item && typeof item === 'object' && keyField in item) {
      return String(item[keyField]);
    }
    return String(index);
  };

  if (!Array.isArray(items) || items.length === 0) {
    if (evaluatedEmptyContent) {
      return <div style={evaluatedStyle}>{evaluatedEmptyContent}</div>;
    }
    return null;
  }

  const containerStyle: React.CSSProperties = {
    ...(gap ? { gap } : {}),
    ...evaluatedStyle,
  };
  const fauiClass = direction === 'horizontal' ? 'faui-repeater-h' : 'faui-repeater';
  const mergedClassName = config.className ? `${fauiClass} ${config.className}` : fauiClass;

  if (resolved && isReady && AnimatePresence && motion) {
    return (
      <div style={containerStyle} className={mergedClassName}>
        <AnimatePresence>
          {items.map((item, index) => {
            const itemKey = getItemKey(item, index);
            const scopePath = path ? `${path}/${index}` : undefined;
            return (
              <motion.div
                key={itemKey}
                className="faui-motion"
                layout={resolved.layout}
                initial={resolved.initial}
                animate={resolved.animate}
                exit={resolved.exit}
                transition={resolved.transition}
              >
                <RendererContextScope $current={item} $parent={items} $scopePath={scopePath}>
                  {templateChildren.map(childId => {
                    const child = componentMap.get(childId);
                    if (!child) return null;
                    return (
                      <ComponentRenderer
                        key={`${itemKey}-${childId}`}
                        component={child}
                        componentMap={componentMap}
                      />
                    );
                  })}
                </RendererContextScope>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div style={containerStyle} className={mergedClassName}>
      {items.map((item, index) => {
        const itemKey = getItemKey(item, index);
        const scopePath = path ? `${path}/${index}` : undefined;
        return (
          <RendererContextScope key={itemKey} $current={item} $parent={items} $scopePath={scopePath}>
            {templateChildren.map(childId => {
              const child = componentMap.get(childId);
              if (!child) return null;
              return (
                <ComponentRenderer
                  key={`${itemKey}-${childId}`}
                  component={child}
                  componentMap={componentMap}
                />
              );
            })}
          </RendererContextScope>
        );
      })}
    </div>
  );
};

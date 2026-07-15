import React from 'react';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';
import { useExpression } from '../hooks/useExpression';
import { useMotion, resolveAnimation } from '../utils/animation';

export const Condition: React.FC<ComponentProps<'condition'>> = ({ config, componentMap }) => {
  const evaluatedWhen = useExpression(config.when);
  const evaluatedMatch = useExpression(config.match);
  const { motion, AnimatePresence, isReady } = useMotion();
  const resolved = config.animation ? resolveAnimation(config.animation) : null;

  let selectedChildren: string[] | undefined;

  if (config.cases && (config.match !== undefined)) {
    const key = String(evaluatedMatch ?? '');
    selectedChildren = config.cases[key] ?? config.default;
  } else {
    selectedChildren = evaluatedWhen ? config.then : (config.else ?? config.default);
  }

  if (!selectedChildren || selectedChildren.length === 0) {
    return null;
  }

  const branchKey = selectedChildren.join(',');

  if (resolved && isReady && AnimatePresence && motion) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={branchKey}
          className="faui-motion"
          initial={resolved.initial}
          animate={resolved.animate}
          exit={resolved.exit}
          transition={resolved.transition}
        >
          {selectedChildren.map(childId => {
            const child = componentMap.get(childId);
            if (!child) return null;
            return <ComponentRenderer key={childId} component={child} componentMap={componentMap} />;
          })}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      {selectedChildren.map(childId => {
        const child = componentMap.get(childId);
        if (!child) return null;
        return <ComponentRenderer key={childId} component={child} componentMap={componentMap} />;
      })}
    </>
  );
};

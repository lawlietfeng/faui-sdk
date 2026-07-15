import React, { useCallback, useMemo } from 'react';
import { Steps as AntdSteps } from 'antd';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import type { ComponentProps } from './index';

export const Steps: React.FC<ComponentProps<'steps'>> = ({ config }) => {
  const { handleAction } = useRendererContext();

  const path = config.current?.path;
  const currentVal = useDataSelector(path);

  // Safely parse current value to number
  const current = useMemo(() => {
    const parsed = parseInt(String(currentVal), 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [currentVal]);

  const evaluatedItems = (useExpression(config.items) || []) as any[];
  const evaluatedDirection = useExpression(config.direction) as 'horizontal' | 'vertical' | undefined;
  const evaluatedLabelPlacement = useExpression(config.labelPlacement) as 'horizontal' | 'vertical' | undefined;
  const evaluatedProgressDot = useExpression(config.progressDot) as boolean | undefined;
  const evaluatedSize = useExpression(config.size) as 'small' | 'default' | undefined;
  const evaluatedStatus = useExpression(config.status) as 'wait' | 'process' | 'finish' | 'error' | undefined;
  const evaluatedType = useExpression(config.type) as 'default' | 'navigation' | 'inline' | undefined;

  const handleChange = useCallback(
    (nextCurrent: number) => {
      if (config.on_change) {
        const [resolved, extra] = resolveOnChange(config.on_change, nextCurrent);
        handleAction(resolved, extra);
      } else if (path) {
        handleAction({
          action: 'update_data',
          path: path,
          value: nextCurrent,
        });
      }
    },
    [config.on_change, handleAction, path]
  );

  return (
    <div style={config.style} className={config.className}>
      <AntdSteps
        current={current}
        items={evaluatedItems}
        orientation={evaluatedDirection}
        titlePlacement={evaluatedLabelPlacement}
        type={evaluatedProgressDot ? 'dot' : evaluatedType}
        size={evaluatedSize}
        status={evaluatedStatus}
        onChange={handleChange}
      />
    </div>
  );
};

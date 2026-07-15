import React, { useMemo } from 'react';
import { Steps } from 'antd';
import { useExpression } from '../hooks/useExpression';
import type { Step} from '../types/schema';
import type { ComponentProps } from './index';



export const StepIndicator: React.FC<ComponentProps<'stepindicator'>> = ({ config }) => {
  const evaluatedDirection = useExpression(config.direction) as 'horizontal' | 'vertical' | undefined;
  const evaluatedCurrent = useExpression(config.current) as number | undefined;
  const evaluatedSteps = useExpression(config.steps) as Step[] | undefined;

  const items = useMemo(() => {
    return (evaluatedSteps || []).map(step => ({
      key: step.id,
      title: step.title,
      status: mapStatus(step.status),
    }));
  }, [evaluatedSteps]);

  return (
    <Steps
      current={evaluatedCurrent ?? 0}
      orientation={evaluatedDirection ?? 'horizontal'}
      size="small"
      items={items}
      style={config.style}
      className={config.className}
    />
  );
};

function mapStatus(status: string): 'wait' | 'process' | 'finish' | 'error' {
  const map: Record<string, 'wait' | 'process' | 'finish' | 'error'> = {
    success: 'finish',
    running: 'process',
    pending: 'wait',
    error: 'error',
  };
  return map[status] || 'wait';
}

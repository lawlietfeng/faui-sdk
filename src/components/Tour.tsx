import React, { useMemo } from 'react';
import { Tour as AntdTour } from 'antd';
import type { TourProps as AntdTourProps, TourStepProps as AntdTourStepProps } from 'antd';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import type { ComponentProps } from './index';

export const Tour: React.FC<ComponentProps<'tour'>> = ({ config }) => {
  const { handleAction } = useRendererContext();

  // 绑定 open 状态
  const openPath = typeof config.open === 'object' ? config.open?.path : undefined;
  const boundOpen = useDataSelector(openPath);
  const isOpen = openPath ? !!boundOpen : !!useExpression(config.open);

  // 绑定 current 状态
  const currentPath = config.current?.path;
  const currentVal = useDataSelector(currentPath);
  const current = currentVal !== undefined ? Number(currentVal) : 0;

  // 解析配置属性
  const stepsConfig = useExpression(config.steps) || [];
  const arrow = useExpression(config.arrow);
  const placement = useExpression(config.placement);
  const mask = useExpression(config.mask);
  const type = useExpression(config.type);
  const zIndex = useExpression(config.zIndex);

  // 转换 steps
  const steps: AntdTourStepProps[] = useMemo(() => {
    return (stepsConfig as any[]).map((step) => {
      // 解析 target：根据字符串选择器查找 DOM 节点
      let targetFn: (() => HTMLElement) | (() => null) | null = null;
      if (step.target && typeof step.target === 'string') {
        targetFn = () => document.querySelector(step.target) as HTMLElement;
      }

      return {
        title: step.title,
        description: step.description,
        placement: step.placement,
        arrow: step.arrow,
        target: targetFn,
        cover: step.cover ? <img alt="tour.cover" src={step.cover} /> : undefined,
      };
    });
  }, [stepsConfig]);

  const handleClose = () => {
    if (config.on_close) {
      handleAction(config.on_close);
    } else if (openPath) {
      handleAction({ action: 'update_data', path: openPath, value: false });
    }
  };

  const handleChange = (nextCurrent: number) => {
    if (config.on_change) {
      const [resolved, extra] = resolveOnChange(config.on_change, nextCurrent);
      handleAction(resolved, extra);
    } else if (currentPath) {
      handleAction({ action: 'update_data', path: currentPath, value: nextCurrent });
    }
  };

  return (
    <AntdTour
      open={isOpen}
      current={current}
      steps={steps}
      arrow={arrow as AntdTourProps['arrow']}
      placement={placement as AntdTourProps['placement']}
      mask={mask as AntdTourProps['mask']}
      type={type as AntdTourProps['type']}
      zIndex={zIndex as number}
      onClose={handleClose}
      onChange={handleChange}
    />
  );
};

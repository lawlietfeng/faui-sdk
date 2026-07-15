import React from 'react';
import { Pagination as AntdPagination } from 'antd';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { useAction } from '../hooks/useAction';
import { useExpression } from '../hooks/useExpression';
import { evaluateExpression } from '../utils/expression';
import { useRendererContext } from '../context/RendererContext';

export const Pagination: React.FC<ComponentProps<'pagination'>> = ({ config }) => {
  const { current, pageSize, on_change } = config;
  const handleAction = useAction();
  const { dataModel } = useRendererContext();

  // 1. 读：订阅绑定的数据路径
  const boundCurrent = useDataSelector<number>(current?.path) || 1;
  const boundPageSize = useDataSelector<number>(pageSize?.path) || 10;

  // 使用 useExpression 包裹其它可能包含插值的属性
  const evaluatedTotal = Number(useExpression(config.total)) || 0;
  const evaluatedDisabled = useExpression(config.disabled) as boolean;
  const evaluatedHideOnSinglePage = useExpression(config.hideOnSinglePage) as boolean;
  const evaluatedShowQuickJumper = useExpression(config.showQuickJumper) as boolean;
  const evaluatedShowSizeChanger = useExpression(config.showSizeChanger) as boolean;
  const evaluatedSimple = useExpression(config.simple) as boolean;
  const evaluatedSize = useExpression(config.size) as 'middle' | 'small';
  const evaluatedResponsive = useExpression(config.responsive) as boolean;
  const evaluatedAlign = useExpression(config.align) as 'start' | 'center' | 'end';
  // 注意：不要对 showTotal 使用 useExpression 包裹，因为它是作为一个需要二次动态求值的模板字符串
  // 否则 useExpression 会在组件渲染时立刻用当前的全局上下文去解析 ${total}，由于上下文中没有 total 变量就会报错 ReferenceError
  const rawShowTotal = config.showTotal;

  // 2. 写：发生交互时回写数据
  const handleChange = (page: number, size: number) => {
    // 始终先保证组件自身双向绑定的回写
    if (current?.path && page !== boundCurrent) {
      handleAction.execute({ action: 'update_data', path: current.path, value: page });
    }
    if (pageSize?.path && size !== boundPageSize) {
      handleAction.execute({ action: 'update_data', path: pageSize.path, value: size });
    }

    // 若配置了自定义动作，再额外触发
    if (on_change) {
      const actions = Array.isArray(on_change) ? on_change : [on_change];
      handleAction.execute(actions.map(action => ({
        ...action,
        payload: { ...action.payload, current: page, pageSize: size },
      })));
    }
  };

  // 支持模板字符串形式的 showTotal，如 "共 ${total} 条"
  const showTotalRender = rawShowTotal
    ? (total: number, range: [number, number]) => {
        // 使用沙盒计算出真实的字符串
        return String(
          evaluateExpression(rawShowTotal, {
            $root: dataModel,
            total,
            range,
          })
        );
      }
    : undefined;

  return (
    <AntdPagination
      style={useExpression(config.style) as React.CSSProperties}
      className={useExpression(config.className) as string}
      current={boundCurrent}
      pageSize={boundPageSize}
      total={evaluatedTotal}
      onChange={handleChange}
      onShowSizeChange={handleChange}
      disabled={evaluatedDisabled}
      hideOnSinglePage={evaluatedHideOnSinglePage}
      showQuickJumper={evaluatedShowQuickJumper}
      showSizeChanger={evaluatedShowSizeChanger}
      simple={evaluatedSimple}
      size={evaluatedSize}
      responsive={evaluatedResponsive}
      align={evaluatedAlign}
      showTotal={showTotalRender}
    />
  );
};

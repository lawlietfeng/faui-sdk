import React, { useCallback, useMemo } from 'react';
import { Tree as AntdTree } from 'antd';
import type { TreeProps } from 'antd';
import { useRendererContext } from '../context/RendererContext';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import type { ComponentProps } from './index';

export const Tree: React.FC<ComponentProps<'tree'>> = ({ config }) => {
  const { handleAction } = useRendererContext();

  // Explicit binding paths
  const checkedKeysPath = config.checkedKeys?.path;
  const selectedKeysPath = config.selectedKeys?.path;
  const expandedKeysPath = config.expandedKeys?.path;

  // Subscribe to values
  const checkedKeys = useDataSelector(checkedKeysPath) as React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] } | undefined;
  const selectedKeys = useDataSelector(selectedKeysPath) as React.Key[] | undefined;
  const expandedKeys = useDataSelector(expandedKeysPath) as React.Key[] | undefined;

  // Evaluate dynamic props
  const evaluatedTreeData = useExpression(config.treeData);
  const evaluatedCheckable = useExpression(config.checkable) as boolean | undefined;
  const evaluatedSelectable = useExpression(config.selectable) as boolean | undefined;
  const evaluatedMultiple = useExpression(config.multiple) as boolean | undefined;
  const evaluatedShowIcon = useExpression(config.showIcon) as boolean | undefined;
  const evaluatedShowLine = useExpression(config.showLine) as boolean | { showLeafIcon: boolean } | undefined;
  const evaluatedDefaultExpandAll = useExpression(config.defaultExpandAll) as boolean | undefined;
  const evaluatedCheckStrictly = useExpression(config.checkStrictly) as boolean | undefined;

  const handleCheck: TreeProps['onCheck'] = useCallback(
    (keys: any, info: any) => {
      // keys is either Key[] or { checked: Key[], halfChecked: Key[] } based on checkStrictly
      if (config.on_check) {
        handleAction({
          ...config.on_check,
          value: keys,
          payload: { info },
        });
      } else if (checkedKeysPath) {
        handleAction({
          action: 'update_data',
          path: checkedKeysPath,
          value: keys,
        });
      }
    },
    [checkedKeysPath, config.on_check, handleAction]
  );

  const handleSelect: TreeProps['onSelect'] = useCallback(
    (keys: any, info: any) => {
      if (config.on_select) {
        handleAction({
          ...config.on_select,
          value: keys,
          payload: { info },
        });
      } else if (selectedKeysPath) {
        handleAction({
          action: 'update_data',
          path: selectedKeysPath,
          value: keys,
        });
      }
    },
    [selectedKeysPath, config.on_select, handleAction]
  );

  const handleExpand: TreeProps['onExpand'] = useCallback(
    (keys: any, info: any) => {
      if (config.on_expand) {
        handleAction({
          ...config.on_expand,
          value: keys,
          payload: { info },
        });
      } else if (expandedKeysPath) {
        handleAction({
          action: 'update_data',
          path: expandedKeysPath,
          value: keys,
        });
      }
    },
    [expandedKeysPath, config.on_expand, handleAction]
  );

  // Avoid rendering if treeData is empty or not resolved yet to prevent "No data" flashing incorrectly
  // However, Antd Tree handles empty treeData natively, so we just pass evaluatedTreeData or []
  const treeData = useMemo(() => {
    if (Array.isArray(evaluatedTreeData)) return evaluatedTreeData;
    return [];
  }, [evaluatedTreeData]);

  return (
    <div style={config.style} className={config.className}>
      <AntdTree
        treeData={treeData}
        checkable={evaluatedCheckable}
        selectable={evaluatedSelectable !== false}
        multiple={evaluatedMultiple}
        showIcon={evaluatedShowIcon}
        showLine={evaluatedShowLine}
        defaultExpandAll={evaluatedDefaultExpandAll}
        checkStrictly={evaluatedCheckStrictly}
        checkedKeys={checkedKeys}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        onCheck={handleCheck}
        onSelect={handleSelect}
        onExpand={handleExpand}
      />
    </div>
  );
};

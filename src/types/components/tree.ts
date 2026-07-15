import { BaseComponentConfig, ValueBinding, ActionConfig } from '../schema';

export interface TreeDataNode {
  title: string;
  key: string | number;
  children?: TreeDataNode[];
  disabled?: boolean;
  disableCheckbox?: boolean;
  selectable?: boolean;
  icon?: string;
  isLeaf?: boolean;
}

export interface TreeComponentConfig extends BaseComponentConfig {
  component: 'tree';
  treeData: TreeDataNode[] | string;
  checkable?: boolean | string;
  selectable?: boolean | string;
  multiple?: boolean | string;
  showIcon?: boolean | string;
  showLine?: boolean | string | { showLeafIcon: boolean };
  defaultExpandAll?: boolean | string;
  checkStrictly?: boolean | string;
  
  // Explicit bindings for Tree specific state
  checkedKeys?: ValueBinding;
  selectedKeys?: ValueBinding;
  expandedKeys?: ValueBinding;

  // Custom events
  on_check?: ActionConfig;
  on_select?: ActionConfig;
  on_expand?: ActionConfig;
}

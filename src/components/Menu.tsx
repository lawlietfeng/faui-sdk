import React from 'react';
import { Menu as AntdMenu } from 'antd';
import * as Icons from '@ant-design/icons';
import type { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { useAction } from '../hooks/useAction';
import { useExpression } from '../hooks/useExpression';
import type { MenuItemConfig } from '../types/components/menu';

export const Menu: React.FC<ComponentProps<'menu'>> = ({ config }) => {
  const {
    items,
    mode = 'inline',
    theme = 'light',
    selectedKeys,
    openKeys,
    defaultSelectedKeys,
    defaultOpenKeys,
    on_click,
    on_select,
    on_open_change,
    inlineCollapsed,
    inlineIndent,
    multiple,
    selectable,
    style,
    className,
  } = config;

  const handleAction = useAction();

  // 1. Read: Subscribe to bounded data paths
  const boundSelectedKeys = useDataSelector<string[]>(selectedKeys?.path);
  const boundOpenKeys = useDataSelector<string[]>(openKeys?.path);

  // Use bound values if defined, else fallback to default values
  const currentSelectedKeys = boundSelectedKeys ?? defaultSelectedKeys;
  const currentOpenKeys = boundOpenKeys ?? defaultOpenKeys;

  // 2. Wrap expressions for items array
  const evaluatedItems = useExpression(items);
  const evaluatedStyle = useExpression(style);
  
  const evaluatedMode = useExpression(mode) as 'vertical' | 'horizontal' | 'inline';
  const evaluatedTheme = useExpression(theme) as 'light' | 'dark';
  const evaluatedInlineCollapsed = useExpression(inlineCollapsed) as boolean | undefined;
  const evaluatedInlineIndent = useExpression(inlineIndent) as number | undefined;
  const evaluatedMultiple = useExpression(multiple) as boolean | undefined;
  const evaluatedSelectable = useExpression(selectable) as boolean | undefined;

  // Recursive function to transform items
  const renderIcon = (iconName?: string) => {
    if (!iconName || typeof iconName !== 'string') return undefined;
    const IconComponent = (Icons as any)[iconName];
    if (!IconComponent) {
      console.warn(`Icon ${iconName} not found in @ant-design/icons`);
      return undefined;
    }
    return <IconComponent />;
  };

  const transformItems = (itemsArray: MenuItemConfig[] | undefined): any[] | undefined => {
    if (!itemsArray || !Array.isArray(itemsArray)) return undefined;

    return itemsArray.map((item) => {
      // It's already evaluated by useExpression, so label, icon etc. are resolved strings
      const { key, label, icon, disabled, type, children } = item;

      const transformedItem: any = {
        key,
        label,
        disabled,
        type,
      };

      if (icon) {
        transformedItem.icon = renderIcon(icon);
      }

      if (children && children.length > 0) {
        transformedItem.children = transformItems(children);
      }

      return transformedItem;
    });
  };

  const antdItems = transformItems(evaluatedItems as MenuItemConfig[]);

  // 3. Write: Handlers
  const handleSelect = (info: { selectedKeys: string[]; key: string; keyPath: string[] }) => {
    const { selectedKeys: newSelectedKeys, key, keyPath } = info;
    
    if (selectedKeys?.path) {
      handleAction.execute({ action: 'update_data', path: selectedKeys.path, value: newSelectedKeys });
    }
    
    if (on_select) {
      handleAction.execute({ ...on_select, value: newSelectedKeys, payload: { key, keyPath } });
    }
  };

  const handleDeselect = (info: any) => {
    const { selectedKeys: newSelectedKeys } = info;
    
    if (selectedKeys?.path) {
      handleAction.execute({ action: 'update_data', path: selectedKeys.path, value: newSelectedKeys });
    }
  };

  const handleClick = (info: any) => {
    const { key, keyPath } = info;
    if (on_click) {
      handleAction.execute({ ...on_click, value: { key, keyPath } });
    }
  };

  const handleOpenChange = (keys: string[]) => {
    if (on_open_change) {
      handleAction.execute({ ...on_open_change, value: keys });
    } else if (openKeys?.path) {
      handleAction.execute({ action: 'update_data', path: openKeys.path, value: keys });
    }
  };

  const menuProps: any = {
    mode: evaluatedMode,
    theme: evaluatedTheme,
    items: antdItems,
    selectedKeys: currentSelectedKeys,
    openKeys: currentOpenKeys,
    onSelect: handleSelect,
    onDeselect: handleDeselect,
    onClick: handleClick,
    onOpenChange: handleOpenChange,
    inlineIndent: evaluatedInlineIndent,
    multiple: evaluatedMultiple,
    selectable: evaluatedSelectable,
    style: evaluatedStyle as React.CSSProperties,
    className,
  };

  if (evaluatedMode === 'inline' && evaluatedInlineCollapsed !== undefined) {
    menuProps.inlineCollapsed = evaluatedInlineCollapsed;
  }

  return (
    <AntdMenu {...menuProps} />
  );
};

import React from 'react';
import { Dropdown as AntdDropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useAction } from '../hooks/useAction';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';

export const Dropdown: React.FC<ComponentProps<'dropdown'>> = ({ config, componentMap }) => {
  const action = useAction();

  // 绑定 open 状态
  const openPath = typeof config.open === 'object' ? config.open?.path : undefined;
  const boundOpen = useDataSelector(openPath);
  const isOpen = openPath ? !!boundOpen : (config.open !== undefined ? !!useExpression(config.open) : undefined);

  // 绑定 selectedKeys (如果需要作为可选中的菜单)
  const selectedKeysPath = typeof config.selectedKeys === 'object' && !Array.isArray(config.selectedKeys) 
    ? (config.selectedKeys as any).path 
    : undefined;
  const boundSelectedKeys = useDataSelector(selectedKeysPath);
  const currentSelectedKeys = selectedKeysPath 
    ? (Array.isArray(boundSelectedKeys) ? boundSelectedKeys : [])
    : (Array.isArray(config.selectedKeys) ? config.selectedKeys : []);

  // 解析普通属性
  const rawItems = useExpression(config.items) || [];
  const trigger = useExpression(config.trigger);
  const placement = useExpression(config.placement);
  const arrow = useExpression(config.arrow);
  const disabled = useExpression(config.disabled);

  // 转换 Menu items
  const menuItems: MenuProps['items'] = rawItems.map((item: any) => {
    // 递归转换的简单逻辑
    const convertItem = (menuItem: any): any => {
      if (menuItem.type === 'divider') return { type: 'divider' };
      
      const converted = {
        key: String(menuItem.key),
        label: menuItem.label,
        disabled: menuItem.disabled,
        danger: menuItem.danger,
        type: menuItem.type,
      } as any;

      // 如果有 icon 配置，可以在此处利用 ComponentRenderer 进行渲染，
      // 但为了避免在 JSON 配置里写复杂的结构，常见做法是将 icon 配置为 string 并在此处映射为 Icon 组件
      // 我们在此处支持通过 componentMap 渲染 icon 组件
      if (menuItem.icon && typeof menuItem.icon === 'string') {
        const iconComponent = componentMap.get(menuItem.icon);
        if (iconComponent) {
          converted.icon = <ComponentRenderer component={iconComponent} componentMap={componentMap} />;
        }
      }

      if (menuItem.children && Array.isArray(menuItem.children)) {
        converted.children = menuItem.children.map(convertItem);
      }

      return converted;
    };
    return convertItem(item);
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (openPath) {
      action.execute({ action: 'update_data', path: openPath, value: newOpen });
    }
    if (config.on_open_change) {
      const actions = Array.isArray(config.on_open_change) ? config.on_open_change : [config.on_open_change];
      actions.forEach(act => action.execute({ 
        ...act, 
        payload: { 
          ...(act.payload || {}),
          open: newOpen 
        } 
      }));
    }
  };

  const handleMenuClick: MenuProps['onClick'] = (info) => {
    // 处理受控选中的回写
    if (selectedKeysPath) {
      // 简单起见，这里假设是单选，每次覆盖
      action.execute({ action: 'update_data', path: selectedKeysPath, value: [info.key] });
    }

    // 触发 on_menu_click，并将点击的 key 注入上下文中，这里通过 $current 注入
    if (config.on_menu_click) {
      const actions = Array.isArray(config.on_menu_click) ? config.on_menu_click : [config.on_menu_click];
      // 注入 payload 到 action 中，让使用方可以通过 ${key} 拿到
      actions.forEach(act => action.execute({ 
        ...act, 
        payload: { 
          ...(act.payload || {}),
          key: info.key, 
          keyPath: info.keyPath 
        } 
      }));
    }
  };

  const dropdownProps: any = {
    menu: {
      items: menuItems,
      onClick: handleMenuClick,
      selectedKeys: currentSelectedKeys as string[],
    },
    trigger,
    placement,
    arrow,
    disabled,
    onOpenChange: handleOpenChange,
  };

  if (isOpen !== undefined) {
    dropdownProps.open = isOpen;
  }

  // 获取触发器组件
  const renderChildren = () => {
    if (!config.children || config.children.length === 0) return null;
    
    return config.children.map((childId) => {
      const childComponent = componentMap.get(childId);
      if (!childComponent) {
        console.warn(`Component not found: ${childId}`);
        return null;
      }
      return (
        <ComponentRenderer
          key={childId}
          component={childComponent}
          componentMap={componentMap}
        />
      );
    });
  };

  return (
    <AntdDropdown {...dropdownProps}>
      {/* 包裹一层，确保能接收事件。有些 antd 组件可以直接作为 children，但为了兼容各种容器，包裹 span */}
      <span
        style={config.style as React.CSSProperties}
        className={config.className ? `faui-trigger-wrap ${config.className}` : 'faui-trigger-wrap'}
        onClick={(e) => e.stopPropagation()}
      >
        {renderChildren()}
      </span>
    </AntdDropdown>
  );
};

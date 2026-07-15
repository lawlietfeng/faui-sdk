import React from 'react';
import { FloatButton as AntdFloatButton } from 'antd';
import * as Icons from '@ant-design/icons';
import { ComponentProps } from './index';
import { FloatButtonItemConfig } from '../types/components/floatButton';
import { useExpression } from '../hooks/useExpression';
import { useAction } from '../hooks/useAction';
import { useDataSelector } from '../hooks/useDataSelector';

export const FloatButton: React.FC<ComponentProps<'float_button'>> = ({ config }) => {
  const {
    variant = 'default',
    icon,
    description,
    tooltip,
    type,
    shape,
    href,
    target,
    badge,
    trigger,
    open: configOpen,
    items,
    visibilityHeight,
    on_tap,
    on_open_change,
    style,
    className
  } = config;

  const { execute } = useAction();

  // Evaluate expressions
  const evalTooltip = useExpression(tooltip);
  const evalDescription = useExpression(description);
  const evalHref = useExpression(href);
  const evalItems = useExpression(items);

  // Controlled open state for Group
  const isOpenPath = typeof configOpen === 'object' ? configOpen.path : undefined;
  const boundOpen = useDataSelector(isOpenPath);
  const isOpen = (isOpenPath ? !!boundOpen : (typeof configOpen === 'boolean' ? configOpen : undefined));

  const handleClick = () => {
    if (on_tap) {
      const actions = Array.isArray(on_tap) ? on_tap : [on_tap];
      actions.forEach(act => execute(act));
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (on_open_change) {
      const actions = Array.isArray(on_open_change) ? on_open_change : [on_open_change];
      actions.forEach(act => execute({ ...act, payload: { open } }));
    }
    // Update data model if bound
    if (typeof configOpen === 'object' && configOpen?.path) {
      execute({ action: 'update_data', path: configOpen.path, value: open });
    }
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return undefined;
    const IconComponent = (Icons as any)[iconName];
    if (!IconComponent) {
      console.warn(`Icon ${iconName} not found in @ant-design/icons`);
      return undefined;
    }
    return <IconComponent />;
  };

  // Base props applied to any variant
  const baseProps = {
    icon: renderIcon(icon),
    description: evalDescription,
    tooltip: evalTooltip,
    type,
    shape,
    href: evalHref,
    target,
    badge,
    style,
    className,
    onClick: variant !== 'group' ? handleClick : undefined, // Group shouldn't trigger base tap if it just opens
  };

  if (variant === 'back-top') {
    // BackTop's target is a function returning scrollable element, so we omit the string target from baseProps
    const { target: _target, ...backTopProps } = baseProps;
    return <AntdFloatButton.BackTop {...backTopProps} visibilityHeight={visibilityHeight} />;
  }

  if (variant === 'group') {
    return (
      <AntdFloatButton.Group
        {...baseProps}
        trigger={trigger}
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        {evalItems?.map((item: FloatButtonItemConfig, index: number) => {
          const handleItemClick = () => {
            if (item.on_tap) {
              const actions = Array.isArray(item.on_tap) ? item.on_tap : [item.on_tap];
              actions.forEach(act => execute(act));
            }
          };

          return (
            <AntdFloatButton
              key={item.id || index}
              icon={renderIcon(item.icon)}
              description={item.description}
              tooltip={item.tooltip}
              type={item.type}
              shape={item.shape}
              href={item.href}
              target={item.target}
              badge={item.badge}
              onClick={handleItemClick}
            />
          );
        })}
      </AntdFloatButton.Group>
    );
  }

  // Default
  return <AntdFloatButton {...baseProps} />;
};

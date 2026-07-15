import React from 'react';
import { Tabs as AntdTabs } from 'antd';
import { ComponentProps } from './index';
import { useDataSelector } from '../hooks/useDataSelector';
import { useAction } from '../hooks/useAction';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useExpression } from '../hooks/useExpression';
import { ComponentRenderer } from '../SchemaRenderer';

// A helper component to evaluate the label expression for a single tab
const TabLabel: React.FC<{ label: any }> = ({ label }) => {
  const evaluatedLabel = useExpression(label);
  return <>{evaluatedLabel}</>;
};

export const Tabs: React.FC<ComponentProps<'tabs'>> = ({ config, componentMap }) => {
  const {
    
    items,
    activeKey,
    defaultActiveKey,
    type,
    size,
    tabPlacement,
    centered,
    destroyOnHidden,
    animated,
    on_change,
  } = config;

  // Bind activeKey via path if it's an object, otherwise use the string directly.
  const boundActiveKeyPath = typeof activeKey === 'object' ? activeKey?.path : undefined;
  const boundActiveKey = useDataSelector(boundActiveKeyPath);

  // The actual activeKey to pass to Antd Tabs
  const currentActiveKey = boundActiveKey !== undefined ? String(boundActiveKey) : (typeof activeKey === 'string' ? activeKey : undefined);

  const action = useAction();

  const evaluatedItems = useExpression(items);

  const handleChange = (key: string) => {
    // Write back to dataModel if it's bound to a path
    if (boundActiveKeyPath) {
      action.execute({
        action: 'update_data',
        path: boundActiveKeyPath,
        value: key,
      });
    }

    // Execute custom on_change actions if any
    if (on_change) {
      const [resolved, extra] = resolveOnChange(on_change, key);
      action.execute(resolved, extra);
    }
  };

  const antdItems = evaluatedItems?.map((item: any) => ({
    key: item.key,
    label: <TabLabel label={item.label} />,
    children: (
      <div style={{ height: '100%', width: '100%' }}>
        {item.children?.map((childId: string) => {
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
        })}
      </div>
    ),
    disabled: item.disabled,
    forceRender: item.forceRender,
    closable: item.closable,
  }));

  const mapPlacement = (p: any) => {
    if (p === 'left') return 'start';
    if (p === 'right') return 'end';
    return p;
  };

  return (
    <AntdTabs
      activeKey={currentActiveKey}
      defaultActiveKey={defaultActiveKey}
      items={antdItems}
      type={type}
      size={size}
      tabPlacement={mapPlacement(tabPlacement)}
      centered={centered}
      destroyOnHidden={destroyOnHidden}
      animated={animated}
      onChange={handleChange}
    />
  );
};

export default Tabs;

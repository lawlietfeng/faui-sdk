import React, { useEffect, useMemo } from 'react';
import { App as AntdApp } from 'antd';
import { RendererContextProvider, useRendererContext } from './context/RendererContext';
import type { Content, Component, DataModel, HttpRequestConfig, ActionConfig } from './types/schema';
import { useExpression } from './hooks/useExpression';
import { setMessageApi } from './actions/message';
import { setNotificationApi } from './actions/notification';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useMotion, resolveAnimation } from './utils/animation';
import { injectFauiStyles } from './utils/injectStyles';

injectFauiStyles();

export interface SchemaRendererProps {
  schema: Content;
  componentRegistry: Record<string, React.FC<{ config: Component; componentMap: Map<string, Component> }>>;
  initialData?: DataModel;
  liveData?: DataModel;
  customComponents?: Record<string, React.FC<{ config: Component; componentMap: Map<string, Component> }>>;
  httpRequest?: (config: HttpRequestConfig) => Promise<unknown>;
  onAction?: (action: ActionConfig, context: { $root: DataModel; $current: unknown; $parent: unknown }) => void | Promise<void>;
}

const EMPTY_DATA: DataModel = {};

export const SchemaRenderer: React.FC<SchemaRendererProps> = ({
  schema,
  componentRegistry: baseRegistry,
  initialData = EMPTY_DATA,
  liveData,
  customComponents,
  httpRequest,
  onAction,
}) => {
  const componentRegistry = useMemo(() => {
    if (!customComponents) return baseRegistry;
    return { ...baseRegistry, ...customComponents };
  }, [baseRegistry, customComponents]);

  if (!schema || !schema.components || !schema.dataModel) {
    return <div>Invalid UI schema: missing components or dataModel</div>;
  }

  return (
    <AntdApp>
      <ActionApiRegistrar />
      <RendererContextProvider
        dataModel={schema.dataModel}
        initialData={initialData}
        liveData={liveData}
        componentRegistry={componentRegistry}
        httpRequest={httpRequest}
        onAction={onAction}
      >
        <AnimatedRoot content={schema} />
      </RendererContextProvider>
    </AntdApp>
  );
};

const AnimatedRoot: React.FC<RootComponentProps> = ({ content }) => {
  const { LayoutGroup, isReady } = useMotion();

  if (isReady && LayoutGroup) {
    return (
      <LayoutGroup>
        <RootComponent content={content} />
      </LayoutGroup>
    );
  }

  return <RootComponent content={content} />;
};

const ActionApiRegistrar: React.FC = () => {
  const { message, notification } = AntdApp.useApp();

  useEffect(() => {
    setMessageApi(message);
    setNotificationApi(notification);
    return () => {
      setMessageApi(null);
      setNotificationApi(null);
    };
  }, [message, notification]);

  return null;
};

interface RootComponentProps {
  content: { components: Component[] };
}

const RootComponent: React.FC<RootComponentProps> = ({ content }) => {
  const componentMap = useMemo(() => {
    const map = new Map<string, Component>();
    content.components.forEach(comp => {
      map.set(comp.id, comp);
    });
    return map;
  }, [content.components]);

  const rootComponent = useMemo(() => {
    return componentMap.get('root');
  }, [componentMap]);

  if (!rootComponent) {
    return <div>No root component found</div>;
  }

  return (
    <ComponentRenderer
      component={rootComponent}
      componentMap={componentMap}
    />
  );
};

interface ComponentRendererInternalProps {
  component: Component;
  componentMap: Map<string, Component>;
}

export const ComponentRenderer: React.FC<ComponentRendererInternalProps> = ({
  component,
  componentMap,
}) => {
  const { componentRegistry, handleAction } = useRendererContext();
  const evaluatedVisible = useExpression(component.visible ?? true);
  const ComponentType = componentRegistry[component.component];
  const { motion, AnimatePresence, isReady } = useMotion();
  const resolved = component.animation ? resolveAnimation(component.animation) : null;

  useEffect(() => {
    if (!component.on_mount) return;
    const actions = Array.isArray(component.on_mount) ? component.on_mount : [component.on_mount];
    (async () => {
      for (const action of actions) {
        await handleAction(action);
      }
    })().catch(err => {
      console.error(`[FAUI] on_mount error in "${component.id}":`, err);
    });
  }, []);

  if (!ComponentType) {
    console.warn(`Unknown component type: ${component.component}`);
    return null;
  }

  if (resolved && isReady && AnimatePresence && motion) {
    return (
      <AnimatePresence>
        {evaluatedVisible && (
          <motion.div
            key={component.id}
            className="faui-motion"
            initial={resolved.initial}
            animate={resolved.animate}
            exit={resolved.exit}
            transition={resolved.transition}
            layout={resolved.layout}
          >
            <ErrorBoundary componentId={component.id} componentType={component.component}>
              <ComponentType config={component} componentMap={componentMap} />
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (!evaluatedVisible) return null;

  return (
    <ErrorBoundary componentId={component.id} componentType={component.component}>
      <ComponentType
        config={component}
        componentMap={componentMap}
      />
    </ErrorBoundary>
  );
};

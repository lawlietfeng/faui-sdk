import React, { useMemo } from 'react';
import { theme } from 'antd';
import { useFormContextOptional } from '../context/FormContext';
import { useDynamicValue } from '../hooks/useDynamicValue';
import { useExpression } from '../hooks/useExpression';
import type { ComponentProps } from './index';

export const Text: React.FC<ComponentProps<'text'>> = ({ config, componentMap }) => {
  const formContext = useFormContextOptional();
  const { token } = theme.useToken();
  const content = useExpression(config.content || '');
  const nextSibling = useMemo(() => getNextSibling(config.id, componentMap), [config.id, componentMap]);
  const nextSiblingVisible = Boolean(useDynamicValue(nextSibling?.visible ?? true));
  const showRequiredMark = Boolean(
    formContext
    && nextSiblingVisible
    && nextSibling?.rules?.some(rule => rule.required === true),
  );

  const style = useMemo(() => ({
    ...config.style,
  }), [config.style]);

  return (
    <span style={style} className={config.className}>
      {showRequiredMark && (
        <span aria-hidden="true" style={{ color: token.colorError, marginInlineEnd: 4 }}>
          *
        </span>
      )}
      {content as string}
    </span>
  );
};

function getNextSibling(componentId: string, componentMap: ComponentProps['componentMap']) {
  let nextSiblingId: string | undefined;
  let referenceCount = 0;

  for (const component of componentMap.values()) {
    const siblings = component.children ?? [];
    for (const [index, childId] of siblings.entries()) {
      if (childId !== componentId) {
        continue;
      }
      referenceCount += 1;
      if (referenceCount > 1) {
        return undefined;
      }
      nextSiblingId = siblings[index + 1];
    }
  }

  return nextSiblingId ? componentMap.get(nextSiblingId) : undefined;
}

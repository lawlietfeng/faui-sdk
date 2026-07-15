import { useCallback } from 'react';
import { useRendererContext } from '../context/RendererContext';
import type { ActionSequence } from '../types/schema';

export function useAction() {
  const { handleAction } = useRendererContext();

  const execute = useCallback(async (action: ActionSequence, extra?: Record<string, unknown>) => {
    await handleAction(action, extra);
  }, [handleAction]);

  return { execute };
}

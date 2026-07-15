import { useCallback } from 'react';
import { useRendererContext } from '../context/RendererContext';

export function useDataModel() {
  const { dataModel, updateData, getData } = useRendererContext();

  const setValue = useCallback((path: string, value: unknown) => {
    updateData(path, value);
  }, [updateData]);

  const getValue = useCallback((path: string) => {
    return getData(path);
  }, [getData]);

  return {
    dataModel,
    setValue,
    getValue,
  };
}

import type { Component } from '../types/schema';
import React, { useCallback, useMemo } from 'react';
import { Upload as AntUpload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { Rule } from 'antd/es/form';
import { useRendererContext } from '../context/RendererContext';
import { resolveOnChange } from '../utils/resolveOnChange';
import { useFormContextOptional } from '../context/FormContext';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';
import type { UploadFile } from 'antd/es/upload/interface';
import { useExpression } from '../hooks/useExpression';
import { useDataSelector } from '../hooks/useDataSelector';

export const Upload: React.FC<ComponentProps<'upload'>> = ({ config, componentMap }) => {
  const { handleAction } = useRendererContext();
  const formContext = useFormContextOptional();

  const path = config.value?.path;
  const dataValue = useDataSelector(path);
  // initialValue usually isn't required for AntUpload if value is fully controlled, but we register it.
  
  const rules = useMemo(() => normalizeRules(config.rules), [config.rules]);

  React.useEffect(() => {
    if (!formContext) {
      return;
    }
    formContext.registerField(config.id, {
      name: resolveFieldName(config),
      rules,
      validateTrigger: config.validateTrigger,
      initialValue: dataValue || [],
    });
    return () => {
      formContext.unregisterField(config.id);
    };
  }, [config.id, config.validateTrigger, formContext, rules, dataValue]);

  const handleChange = useCallback((info: { fileList: UploadFile[] }) => {
    formContext?.syncFieldValue(config.id, info.fileList);
    void formContext?.validateField(config.id);

    if (config.on_change) {
      const [resolved, extra] = resolveOnChange(config.on_change, info.fileList);
      handleAction(resolved, extra);
    } else if (path) {
      handleAction({
        action: 'update_data',
        path,
        value: info.fileList,
      });
    }
  }, [config.id, config.on_change, path, formContext, handleAction]);

  const buttonChild = config.children
    ?.map(id => componentMap.get(id))
    .find(comp => comp?.component === 'button');
  const errorInfo = formContext?.getFieldErrorInfo(config.id);

  const evaluatedAccept = useExpression(config.accept) as string | undefined;
  const evaluatedMultiple = useExpression(config.multiple) as boolean | undefined;
  const evaluatedMaxCount = useExpression(config.maxCount) as number | undefined;
  const evaluatedListType = useExpression(config.listType) as 'text' | 'picture' | 'picture-card' | undefined;
  const evaluatedShowUploadList = useExpression(config.showUploadList) as boolean | undefined;

  return (
    <div>
      <AntUpload
        accept={evaluatedAccept}
        multiple={evaluatedMultiple}
        maxCount={evaluatedMaxCount}
        listType={evaluatedListType}
        showUploadList={evaluatedShowUploadList}
        onChange={handleChange}
        className={config.className}
        fileList={Array.isArray(dataValue) ? dataValue as UploadFile[] : undefined}
      >
        {buttonChild ? (
          <ComponentRenderer
            component={buttonChild}
            componentMap={componentMap}
          />
        ) : (
          <Button icon={<UploadOutlined />}>
            {useExpression(config.label) || '点击上传'}
          </Button>
        )}
      </AntUpload>
      {errorInfo?.help && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{errorInfo.help}</div>
      )}
    </div>
  );
};

function resolveFieldName(config: Component): string {
  if (config.field) {
    return config.field;
  }
  if (config.value?.path) {
    return config.value.path.replace(/^\/+/, '').replace(/\//g, '.');
  }
  return config.id;
}

function normalizeRules(rules?: Component['rules']): Rule[] | undefined {
  if (!rules || rules.length === 0) {
    return undefined;
  }
  return rules.map((rule: any) => ({
    ...rule,
    pattern: rule.pattern ? new RegExp(rule.pattern) : undefined,
  })) as Rule[];
}

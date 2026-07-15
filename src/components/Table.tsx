import type { TableColumn} from '../types/schema';
import React, { useMemo } from 'react';
import { Checkbox as AntCheckbox, Table as AntTable, Tag } from 'antd';
import { useExpression } from '../hooks/useExpression';
import { RendererContextScope, useRendererContext } from '../context/RendererContext';
import { useDataSelector } from '../hooks/useDataSelector';
import { ComponentRenderer } from '../SchemaRenderer';
import type { ComponentProps } from './index';
import { evaluateExpression } from '../utils/expression';



type TableRow = Record<string, unknown>;

export const Table: React.FC<ComponentProps<'table'>> = ({ config, componentMap }) => {
  const { dataModel } = useRendererContext();

  const dataPath = config.data?.path;
  const rawData = useDataSelector(dataPath);
  const dataSource = useExpression(Array.isArray(rawData) ? rawData : []) as TableRow[];
  const evaluatedColumns = (useExpression(config.columns) || []) as TableColumn[];
  const evaluatedPagination = useExpression(config.pagination);
  const evaluatedBordered = useExpression(config.bordered) as boolean | undefined;
  const evaluatedTableSize = useExpression(config.tableSize) as 'small' | 'middle' | 'large' | undefined;
  const evaluatedEmptyText = useExpression(config.emptyText) as string | undefined;

  const columns = useMemo(
    () =>
      evaluatedColumns.map((column, index) => ({
        title: column.title,
        dataIndex: column.dataIndex,
        key: column.key || `${column.dataIndex}-${index}`,
        width: column.width,
        align: column.align,
        render: (value: unknown, record: TableRow) => {
          if (column.component) {
            const childComponent = componentMap.get(column.component);
            if (childComponent) {
              return (
                <RendererContextScope key={`${column.component}-${record.id || (record as any).key || (record as any).empId}`} $current={record} $parent={dataSource}>
                  <ComponentRenderer component={childComponent} componentMap={componentMap} />
                </RendererContextScope>
              );
            }
            console.warn(`Component not found for column.component: ${column.component}`);
            return null;
          }

          const displayValue = column.template
            ? evaluateExpression(column.template, {
                $root: dataModel,
                $current: record,
                $parent: dataSource,
              })
            : value;
          if (column.renderAs === 'checkbox') {
            return <AntCheckbox checked={Boolean(displayValue)} disabled />;
          }
          if (column.renderAs === 'tag') {
            const color = column.statusColors?.[String(displayValue)] || 'default';
            return <Tag color={color}>{String(displayValue ?? '')}</Tag>;
          }
          return String(displayValue ?? '');
        },
      })),
    [evaluatedColumns, dataModel, dataSource, componentMap]
  );

  const pagination = useMemo(() => {
    if (evaluatedPagination === undefined || evaluatedPagination === false) {
      return false;
    }
    if (evaluatedPagination === true) {
      return {};
    }
    return evaluatedPagination as any;
  }, [evaluatedPagination]);

  return (
    <AntTable
      style={config.style}
      className={config.className}
      dataSource={dataSource}
      columns={columns}
      rowKey={config.rowKey || 'id'}
      pagination={pagination}
      bordered={evaluatedBordered}
      size={evaluatedTableSize}
      locale={evaluatedEmptyText ? { emptyText: evaluatedEmptyText } : undefined}
    />
  );
};

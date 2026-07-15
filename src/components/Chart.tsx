import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDataSelector } from '../hooks/useDataSelector';
import { useExpression } from '../hooks/useExpression';
import type { ComponentProps } from './index';
import type { ChartComponentConfig } from '../types/components/chart';

type EChartsInstance = {
  setOption: (option: Record<string, unknown>, notMerge?: boolean) => void;
  resize: () => void;
  dispose: () => void;
  showLoading: () => void;
  hideLoading: () => void;
};

type EChartsModule = {
  init: (dom: HTMLElement, theme?: string | null) => EChartsInstance;
  use: (components: unknown[]) => void;
};

let echartsModule: EChartsModule | null = null;
let echartsLoadPromise: Promise<EChartsModule> | null = null;
let registeredModules = false;

async function loadECharts(): Promise<EChartsModule> {
  if (echartsModule) return echartsModule;
  if (echartsLoadPromise) return echartsLoadPromise;

  echartsLoadPromise = (async () => {
    const [core, charts, components, renderers] = await Promise.all([
      import('echarts/core'),
      import('echarts/charts'),
      import('echarts/components'),
      import('echarts/renderers'),
    ]);

    const mod = core as unknown as EChartsModule;

    if (!registeredModules) {
      const allCharts = Object.values(charts).filter(v => typeof v === 'function');
      const allComponents = Object.values(components).filter(v => typeof v === 'function');
      const allRenderers = Object.values(renderers).filter(v => typeof v === 'function');
      mod.use([...allCharts, ...allComponents, ...allRenderers]);
      registeredModules = true;
    }

    echartsModule = mod;
    return mod;
  })();

  return echartsLoadPromise;
}

function buildOption(
  config: ChartComponentConfig,
  data: unknown[],
): Record<string, unknown> {
  const chartType = config.chartType || 'line';
  const xField = config.xField;
  const yField = config.yField;
  const seriesField = config.seriesField;

  const option: Record<string, unknown> = {};

  if (config.title) {
    option.title = { text: config.title };
  }
  if (config.showTooltip !== false) {
    option.tooltip = { trigger: chartType === 'pie' ? 'item' : 'axis' };
  }

  if (chartType === 'pie') {
    const seriesData = data.map((item: any) => ({
      name: xField ? item[xField] : undefined,
      value: yField ? item[Array.isArray(yField) ? yField[0] : yField] : undefined,
    }));
    option.series = [{ type: 'pie', data: seriesData }];
    if (config.showLegend !== false) {
      option.legend = {};
    }
    return option;
  }

  if (chartType === 'radar') {
    const indicator = data.map((item: any) => ({
      name: xField ? item[xField] : '',
      max: 100,
    }));
    const values = data.map((item: any) => {
      const yf = Array.isArray(yField) ? yField[0] : yField;
      return yf ? item[yf] : 0;
    });
    option.radar = { indicator };
    option.series = [{ type: 'radar', data: [{ value: values }] }];
    return option;
  }

  if (chartType === 'gauge' || chartType === 'funnel') {
    const yf = Array.isArray(yField) ? yField[0] : yField;
    if (chartType === 'gauge') {
      option.series = [{
        type: 'gauge',
        data: data.slice(0, 1).map((item: any) => ({
          value: yf ? item[yf] : 0,
          name: xField ? item[xField] : '',
        })),
      }];
    } else {
      option.series = [{
        type: 'funnel',
        data: data.map((item: any) => ({
          value: yf ? item[yf] : 0,
          name: xField ? item[xField] : '',
        })),
      }];
      if (config.showLegend !== false) {
        option.legend = {};
      }
    }
    return option;
  }

  // Cartesian charts: line, bar, scatter, area, heatmap
  if (xField) {
    const categories = data.map((item: any) => item[xField]);
    option.xAxis = { type: 'category', data: categories };
  } else {
    option.xAxis = { type: 'category' };
  }
  option.yAxis = { type: 'value' };

  const yFields = Array.isArray(yField) ? yField : (yField ? [yField] : []);

  if (seriesField && !Array.isArray(yField)) {
    const groups = new Map<string, unknown[]>();
    data.forEach((item: any) => {
      const key = String(item[seriesField] ?? '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    const series: Record<string, unknown>[] = [];
    groups.forEach((items, name) => {
      const yf = yFields[0];
      series.push({
        name,
        type: chartType === 'area' ? 'line' : chartType,
        data: items.map((item: any) => yf ? item[yf] : 0),
        ...(chartType === 'area' ? { areaStyle: {} } : {}),
        ...(config.smooth ? { smooth: true } : {}),
        ...(config.stacked ? { stack: 'total' } : {}),
      });
    });
    option.series = series;
    if (config.showLegend !== false) {
      option.legend = {};
    }
  } else {
    option.series = yFields.map((yf) => ({
      name: yFields.length > 1 ? yf : undefined,
      type: chartType === 'area' ? 'line' : chartType,
      data: data.map((item: any) => item[yf]),
      ...(chartType === 'area' ? { areaStyle: {} } : {}),
      ...(config.smooth ? { smooth: true } : {}),
      ...(config.stacked ? { stack: 'total' } : {}),
    }));
    if (yFields.length > 1 && config.showLegend !== false) {
      option.legend = {};
    }
  }

  return option;
}

export const Chart: React.FC<ComponentProps<'chart'>> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [chartVersion, setChartVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const rawData = useDataSelector(config.data?.path);
  const evaluatedOption = useExpression(config.option) as Record<string, unknown> | undefined;
  const evaluatedTitle = useExpression(config.title) as string | undefined;
  const evaluatedLoading = useExpression(config.loading);
  const evaluatedStyle = useExpression(config.style) as React.CSSProperties | undefined;
  const evaluatedTheme = useExpression(config.theme) as string | undefined;

  const data = Array.isArray(rawData) ? rawData : [];
  const height = config.height ?? 400;
  const isLoading = evaluatedLoading === true || evaluatedLoading === 'true';
  const theme = evaluatedTheme || null;

  useEffect(() => {
    loadECharts()
      .then(() => setReady(true))
      .catch(() => setError('ECharts is not installed. Run: npm install echarts'));
  }, []);

  const initChart = useCallback(() => {
    if (!ready || !containerRef.current || !echartsModule) return;
    if (!containerRef.current.clientWidth || !containerRef.current.clientHeight) return;

    if (chartRef.current) {
      chartRef.current.dispose();
    }

    chartRef.current = echartsModule.init(containerRef.current, theme);
    setChartVersion(v => v + 1);
  }, [ready, theme]);

  useEffect(() => {
    initChart();
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [initChart]);

  useEffect(() => {
    if (!chartRef.current) return;

    let option: Record<string, unknown>;
    if (evaluatedOption) {
      option = { ...evaluatedOption };
      if (evaluatedTitle && !option.title) {
        option.title = { text: evaluatedTitle };
      }
    } else {
      const cfg = { ...config, title: evaluatedTitle };
      option = buildOption(cfg as ChartComponentConfig, data);
    }

    chartRef.current.setOption(option, true);
  }, [evaluatedOption, evaluatedTitle, data, config.chartType, config.xField, config.yField, config.seriesField, config.smooth, config.stacked, config.showLegend, config.showTooltip, chartVersion]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (isLoading) {
      chartRef.current.showLoading();
    } else {
      chartRef.current.hideLoading();
    }
  }, [isLoading, chartVersion]);

  useEffect(() => {
    if (!containerRef.current) return;
    let rafId = 0;
    let retries = 0;

    const tryInit = () => {
      if (chartRef.current || !containerRef.current) return;
      if (containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) {
        initChart();
        return;
      }
      if (retries < 20) {
        retries++;
        rafId = requestAnimationFrame(tryInit);
      }
    };

    const ro = new ResizeObserver(() => {
      if (!chartRef.current) {
        tryInit();
      } else {
        chartRef.current.resize();
      }
    });
    ro.observe(containerRef.current);

    if (!chartRef.current) {
      rafId = requestAnimationFrame(tryInit);
    }

    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ready, initChart]);

  if (error) {
    return (
      <div style={{
        padding: 24,
        border: '1px solid #ffa39e',
        borderRadius: 8,
        background: '#fff2f0',
        color: '#cf1322',
        textAlign: 'center',
        height: typeof height === 'number' ? height : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: typeof height === 'number' ? height : height,
        ...evaluatedStyle,
      }}
    />
  );
};

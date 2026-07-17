import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const echartsMock = vi.hoisted(() => ({
  init: vi.fn(),
  use: vi.fn(),
  instance: {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
  },
}));

vi.mock("echarts/core", () => ({
  init: echartsMock.init,
  use: echartsMock.use,
}));
vi.mock("echarts/charts", () => ({ LineChart: vi.fn(), BarChart: vi.fn() }));
vi.mock("echarts/components", () => ({ TooltipComponent: vi.fn(), TitleComponent: vi.fn() }));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: vi.fn() }));

import type { Component } from "../../src/types/schema";
import { RendererContextProvider } from "../../src/context/RendererContext";
import { Chart } from "../../src/components/Chart";

function renderChart(config: Record<string, unknown>, dataModel: Record<string, unknown>) {
  const resolved = { id: "chart", component: "chart", data: { path: "/rows" }, ...config } as unknown as Component;
  return render(
    <RendererContextProvider dataModel={dataModel} componentRegistry={{}}>
      <Chart config={resolved as any} componentMap={new Map()} />
    </RendererContextProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  echartsMock.init.mockReturnValue(echartsMock.instance);
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 400 });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, value: 300 });
});

describe("Chart", () => {
  it("registers ECharts modules, initializes, updates loading and disposes", async () => {
    const view = renderChart({
      chartType: "line",
      xField: "month",
      yField: "amount",
      title: "Sales",
      loading: true,
      theme: "dark",
      smooth: true,
      stacked: true,
    }, {
      rows: [{ month: "Jan", amount: 10 }, { month: "Feb", amount: 20 }],
    });

    await waitFor(() => expect(echartsMock.init).toHaveBeenCalledWith(expect.any(HTMLElement), "dark"));
    await waitFor(() => expect(echartsMock.instance.setOption).toHaveBeenCalled());
    expect(echartsMock.use).toHaveBeenCalled();
    expect(echartsMock.instance.setOption).toHaveBeenCalledWith({
      title: { text: "Sales" },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: ["Jan", "Feb"] },
      yAxis: { type: "value" },
      series: [{
        name: undefined,
        type: "line",
        data: [10, 20],
        smooth: true,
        stack: "total",
      }],
    }, true);
    expect(echartsMock.instance.showLoading).toHaveBeenCalled();

    view.unmount();
    expect(echartsMock.instance.dispose).toHaveBeenCalled();
  });

  it.each([
    ["pie", { series: [{ type: "pie", data: [{ name: "A", value: 10 }] }], legend: {} }],
    ["radar", { radar: { indicator: [{ name: "A", max: 100 }] }, series: [{ type: "radar", data: [{ value: [10] }] }] }],
    ["gauge", { series: [{ type: "gauge", data: [{ name: "A", value: 10 }] }] }],
    ["funnel", { series: [{ type: "funnel", data: [{ name: "A", value: 10 }] }], legend: {} }],
  ] as const)("builds %s options", async (chartType, expected) => {
    const view = renderChart({ chartType, xField: "name", yField: "value", showTooltip: false }, {
      rows: [{ name: "A", value: 10 }],
    });

    await waitFor(() => expect(echartsMock.instance.setOption).toHaveBeenCalled());
    const calls = echartsMock.instance.setOption.mock.calls;
    const option = calls[calls.length - 1]?.[0];
    expect(option).toMatchObject(expected);
    expect(option).not.toHaveProperty("tooltip");
    view.unmount();
  });

  it("builds grouped area series and multi-value cartesian series", async () => {
    const first = renderChart({
      chartType: "area",
      xField: "month",
      yField: "amount",
      seriesField: "team",
      smooth: true,
      stacked: true,
    }, {
      rows: [
        { month: "Jan", amount: 10, team: "A" },
        { month: "Feb", amount: 20, team: "B" },
      ],
    });
    await waitFor(() => expect(echartsMock.instance.setOption).toHaveBeenCalled());
    let calls = echartsMock.instance.setOption.mock.calls;
    let option = calls[calls.length - 1]?.[0];
    expect(option.series).toEqual([
      { name: "A", type: "line", data: [10], areaStyle: {}, smooth: true, stack: "total" },
      { name: "B", type: "line", data: [20], areaStyle: {}, smooth: true, stack: "total" },
    ]);
    first.unmount();

    const second = renderChart({ chartType: "bar", xField: "month", yField: ["amount", "count"] }, {
      rows: [{ month: "Jan", amount: 10, count: 2 }],
    });
    await waitFor(() => expect(echartsMock.instance.setOption).toHaveBeenCalledTimes(2));
    calls = echartsMock.instance.setOption.mock.calls;
    option = calls[calls.length - 1]?.[0];
    expect(option.series).toEqual([
      { name: "amount", type: "bar", data: [10] },
      { name: "count", type: "bar", data: [2] },
    ]);
    expect(option.legend).toEqual({});
    second.unmount();
  });

  it("uses a supplied option and adds a missing evaluated title", async () => {
    const view = renderChart({
      option: { series: [{ type: "custom" }] },
      title: "Custom",
      loading: false,
      height: "50vh",
    }, { rows: [] });

    await waitFor(() => expect(echartsMock.instance.setOption).toHaveBeenCalledWith({
      series: [{ type: "custom" }],
      title: { text: "Custom" },
    }, true));
    expect(echartsMock.instance.hideLoading).toHaveBeenCalled();
    expect(view.container.firstElementChild).toBeInTheDocument();
    view.unmount();
  });
});

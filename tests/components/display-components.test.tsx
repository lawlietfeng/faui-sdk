import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  calls: {} as Record<string, any[]>,
  goTo: vi.fn(),
}));

vi.mock("antd", async () => {
  const ReactModule = await import("react");
  const make = (name: string, withRef = false) => {
    const renderComponent = (props: any, ref?: React.ForwardedRef<any>) => {
      mocks.calls[name] = [...(mocks.calls[name] ?? []), props];
      ReactModule.useImperativeHandle(ref, () => ({ goTo: mocks.goTo }));
      const itemChildren = Array.isArray(props.items)
        ? props.items.map((item: any) => item?.children ?? item?.content).filter(ReactModule.isValidElement)
        : null;
      return ReactModule.createElement("div", { "data-antd": name }, props.children, itemChildren);
    };
    return withRef
      ? ReactModule.forwardRef<any, any>(renderComponent)
      : (props: any) => renderComponent(props);
  };
  const App = make("App") as any;
  App.useApp = () => ({ message: {}, notification: {} });
  const Empty = make("Empty") as any;
  Empty.PRESENTED_IMAGE_SIMPLE = "simple-image";
  Empty.PRESENTED_IMAGE_DEFAULT = "default-image";
  const Layout = make("Layout") as any;
  Layout.Header = make("Layout.Header");
  Layout.Sider = make("Layout.Sider");
  Layout.Content = make("Layout.Content");
  Layout.Footer = make("Layout.Footer");
  const FloatButton = make("FloatButton") as any;
  FloatButton.Group = make("FloatButton.Group");
  FloatButton.BackTop = make("FloatButton.BackTop");
  const Skeleton = make("Skeleton") as any;
  Skeleton.Button = make("Skeleton.Button");
  Skeleton.Avatar = make("Skeleton.Avatar");
  Skeleton.Input = make("Skeleton.Input");
  Skeleton.Image = make("Skeleton.Image");
  Skeleton.Node = make("Skeleton.Node");
  const Statistic = make("Statistic") as any;
  Statistic.Timer = make("Statistic.Timer");
  const Typography = make("Typography") as any;
  Typography.Title = make("Typography.Title");
  Typography.Paragraph = make("Typography.Paragraph");
  Typography.Link = make("Typography.Link");
  Typography.Text = make("Typography.Text");
  return {
    App,
    message: { config: vi.fn(), info: vi.fn() },
    notification: { config: vi.fn(), info: vi.fn() },
    Affix: make("Affix"),
    Anchor: make("Anchor"),
    Badge: make("Badge"),
    Card: make("Card"),
    Carousel: make("Carousel", true),
    Collapse: make("Collapse"),
    Empty,
    Flex: make("Flex"),
    Row: make("Row"),
    Col: make("Col"),
    Layout,
    FloatButton,
    Skeleton,
    Space: make("Space"),
    Spin: make("Spin"),
    Statistic,
    Steps: make("Steps"),
    Table: make("Table"),
    Checkbox: make("Checkbox"),
    Tag: make("Tag"),
    Timeline: make("Timeline"),
    Typography,
    Watermark: make("Watermark"),
  };
});

vi.mock("@ant-design/icons", () => ({
  HomeOutlined: (props: any) => <span data-testid="home-icon" {...props} />,
  MissingIcon: undefined,
}));

import type { ActionConfig, Component } from "../../src/types/schema";
import { RendererContextProvider, useRendererContext } from "../../src/context/RendererContext";
import { Affix } from "../../src/components/Affix";
import { Anchor } from "../../src/components/Anchor";
import { Badge } from "../../src/components/Badge";
import { Card } from "../../src/components/Card";
import { Carousel } from "../../src/components/Carousel";
import { Collapse } from "../../src/components/Collapse";
import { Empty } from "../../src/components/Empty";
import { Flex } from "../../src/components/Flex";
import { Row, Col } from "../../src/components/Grid";
import { Layout, Header, Sider, Content, Footer } from "../../src/components/Layout";
import { List } from "../../src/components/List";
import { FloatButton } from "../../src/components/FloatButton";
import { Icon } from "../../src/components/Icon";
import { Skeleton } from "../../src/components/Skeleton";
import { Space } from "../../src/components/Space";
import { Spin } from "../../src/components/Spin";
import { Statistic } from "../../src/components/Statistic";
import { StepIndicator } from "../../src/components/StepIndicator";
import { Table } from "../../src/components/Table";
import { Timeline } from "../../src/components/Timeline";
import { Typography } from "../../src/components/Typography";
import { Watermark } from "../../src/components/Watermark";

const TextProbe: React.FC<{ config: Component }> = ({ config }) => <span>{config.content}</span>;
const ScopeProbe: React.FC = () => {
  const { $current } = useRendererContext();
  return <span>{String(($current as { name?: string })?.name)}</span>;
};
const child = { id: "child", component: "text-probe", content: "Child" } as Component;
const scoped = { id: "scoped", component: "scope-probe" } as Component;

function lastProps(name: string): any {
  const calls = mocks.calls[name];
  return calls?.[calls.length - 1];
}

function renderTarget(
  ComponentType: React.FC<any>,
  config: Record<string, unknown>,
  options: {
    dataModel?: Record<string, unknown>;
    onAction?: (action: ActionConfig) => void | Promise<void>;
  } = {},
) {
  const root = { id: "root", component: "target", ...config } as unknown as Component;
  const componentMap = new Map<string, Component>([["child", child], ["scoped", scoped]]);
  return render(
    <RendererContextProvider
      dataModel={options.dataModel ?? { count: 8, open: true, current: 2 }}
      componentRegistry={{ "text-probe": TextProbe, "scope-probe": ScopeProbe }}
      onAction={options.onAction}
    >
      <ComponentType config={root} componentMap={componentMap} />
    </RendererContextProvider>,
  );
}

beforeEach(() => {
  mocks.calls = {};
  mocks.goTo.mockClear();
});

describe("display containers", () => {
  it.each([
    ["Flex", Flex, { vertical: true, wrap: true, gap: 8, children: ["child", "missing"] }],
    ["Row", Row, { align: "middle", justify: "space-between", gutter: 8, children: ["child", "missing"] }],
    ["Col", Col, { span: 12, offset: 1, xs: 24, children: ["child", "missing"] }],
    ["Layout", Layout, { hasSider: true, domId: "layout", children: ["child", "missing"] }],
    ["Layout.Header", Header, { children: ["child", "missing"] }],
    ["Layout.Content", Content, { children: ["child", "missing"] }],
    ["Layout.Footer", Footer, { children: ["child", "missing"] }],
  ] as const)("%s renders configured children", (antdName, ComponentType, config) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderTarget(ComponentType, config as unknown as Record<string, unknown>);

    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(lastProps(antdName)).toBeDefined();
    expect(warn).toHaveBeenCalledWith("Component not found: missing");
  });

  it("Badge prefers bound count and Card handles legacy border configuration", () => {
    const badge = renderTarget(Badge, {
      data: { path: "/count" }, count: 1, content: "Status", children: ["child", "missing"],
    });
    expect(lastProps("Badge")).toMatchObject({ count: 8, text: "Status" });
    badge.unmount();

    renderTarget(Card, { title: "Card", bordered: false, size: "small", children: ["child", "missing"] });
    expect(lastProps("Card")).toMatchObject({ title: "Card", variant: "borderless", size: "small" });
  });

  it("Collapse maps option children", () => {
    renderTarget(Collapse, {
      options: [{ label: "Panel", value: "panel", children: ["child", "missing"] }],
      bordered: false,
    });
    expect(lastProps("Collapse").items[0]).toMatchObject({ key: "panel", label: "Panel" });
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it.each([
    ["simple", "simple-image"],
    ["default", "default-image"],
    ["/empty.svg", "/empty.svg"],
  ])("Empty maps the %s image", (image, expected) => {
    renderTarget(Empty, {
      image,
      imageStyle: { width: 80 },
      description: "Nothing",
      content: "fallback",
      children: ["child", "missing"],
    });
    expect(lastProps("Empty")).toMatchObject({ image: expected, description: "Nothing" });
  });

  it("Space and Spin render nested content with evaluated settings", () => {
    const first = renderTarget(Space, {
      direction: "vertical", size: "large", split: "|", wrap: true, children: ["child", "missing"],
    });
    expect(lastProps("Space")).toMatchObject({ orientation: "vertical", size: "large", wrap: true });
    first.unmount();

    renderTarget(Spin, { spinning: true, tip: "Loading", size: "large", children: ["child", "missing"] });
    expect(lastProps("Spin")).toMatchObject({ spinning: true, description: "Loading", size: "large" });
  });
});

describe("bound list and navigation displays", () => {
  it("List establishes item scope and rejects non-array data", () => {
    const first = renderTarget(List, { data: { path: "/items" }, children: ["scoped", "missing"] }, {
      dataModel: { items: [{ name: "Ann" }, { name: "Bob" }] },
    });
    expect(screen.getByText("Ann")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    first.unmount();

    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const second = renderTarget(List, { data: { path: "/items" } }, { dataModel: { items: "invalid" } });
    expect(warn).toHaveBeenCalledWith("List data is not an array:", "invalid");
    expect(second.container.textContent).toBe("");
  });

  it("Sider writes bound collapse state or custom actions", async () => {
    const onAction = vi.fn();
    const first = renderTarget(Sider, {
      collapsible: true, value: { path: "/collapsed" }, children: ["child", "missing"],
    }, { dataModel: { collapsed: false }, onAction });
    act(() => lastProps("Layout.Sider").onCollapse(true));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/collapsed", value: true }), expect.anything(),
    ));
    first.unmount();

    renderTarget(Sider, {
      collapsible: true,
      on_change: { action: "update_data", path: "/custom" },
    }, { onAction });
    act(() => lastProps("Layout.Sider").onCollapse(false));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/custom", value: false }),
      expect.objectContaining({ $value: false }),
    ));
  });

  it("Affix and Anchor resolve targets and dispatch events", async () => {
    const target = document.createElement("div");
    target.id = "scroll-target";
    document.body.appendChild(target);
    const onAction = vi.fn();
    renderTarget(Affix, {
      targetSelector: "#scroll-target",
      children: ["child", "missing"],
      on_change: { action: "update_data", path: "/affixed" },
    }, { onAction });
    await waitFor(() => expect(lastProps("Affix").target()).toBe(target));
    act(() => lastProps("Affix").onChange(true));

    renderTarget(Anchor, {
      targetSelector: "#scroll-target",
      items: [{ key: "a", href: "#a", title: "A", children: [{ key: "b", href: "#b", title: "B" }] }],
      on_click: { action: "update_data", path: "/clicked" },
      on_change: { action: "update_data", path: "/anchor" },
    }, { onAction });
    await waitFor(() => expect(lastProps("Anchor")).toBeDefined());
    act(() => lastProps("Anchor").onClick({} as any, { href: "#a", title: "A" }));
    act(() => lastProps("Anchor").onChange("#b"));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(3));
    expect(lastProps("Anchor").items[0].children[0].href).toBe("#b");
  });

  it("Carousel synchronizes current index and emits default and custom changes", async () => {
    const onAction = vi.fn();
    renderTarget(Carousel, {
      current: { path: "/current" },
      items: [{ key: "one", children: ["child", "missing"] }],
      on_change: { action: "update_data", path: "/carouselEvent" },
    }, { dataModel: { current: 2 }, onAction });

    await waitFor(() => expect(mocks.goTo).toHaveBeenCalledWith(2, false));
    act(() => lastProps("Carousel").afterChange(3));
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(2));
  });
});

describe("special display transformations", () => {
  it("FloatButton supports default, back-top and controlled group variants", async () => {
    const onAction = vi.fn();
    const first = renderTarget(FloatButton, {
      icon: "HomeOutlined",
      on_tap: [
        { action: "update_data", path: "/tap1", value: true },
        { action: "update_data", path: "/tap2", value: true },
      ],
    }, { onAction });
    act(() => lastProps("FloatButton").onClick());
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(2));
    first.unmount();

    const second = renderTarget(FloatButton, { variant: "back-top", visibilityHeight: 200 }, { onAction });
    expect(lastProps("FloatButton.BackTop").visibilityHeight).toBe(200);
    second.unmount();

    renderTarget(FloatButton, {
      variant: "group",
      open: { path: "/open" },
      on_open_change: { action: "update_data", path: "/openEvent" },
      items: [{ id: "item", icon: "HomeOutlined", on_tap: { action: "update_data", path: "/item" } }],
    }, { dataModel: { open: true }, onAction });
    act(() => lastProps("FloatButton.Group").onOpenChange(false));
    act(() => lastProps("FloatButton").onClick());
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(5));
  });

  it("Icon uses bound names and handles missing names", () => {
    const first = renderTarget(Icon, { value: { path: "/icon" }, spin: true, rotate: 90 }, {
      dataModel: { icon: "HomeOutlined" },
    });
    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
    first.unmount();

    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderTarget(Icon, { icon: "MissingIcon" });
    expect(warn).toHaveBeenCalledWith("Icon MissingIcon not found in @ant-design/icons");
  });

  it.each(["button", "avatar", "input", "image", "node"])("Skeleton renders the %s variant", (skeletonType) => {
    renderTarget(Skeleton, { skeletonType, active: true, size: "large", shape: "round", block: true });
    const suffix = skeletonType[0].toUpperCase() + skeletonType.slice(1);
    expect(lastProps(`Skeleton.${suffix}`)).toBeDefined();
  });

  it("Skeleton resolves bound loading and renders real children", () => {
    renderTarget(Skeleton, { visible: { path: "/loading" }, children: ["child", "missing"] }, {
      dataModel: { loading: false },
    });
    expect(lastProps("Skeleton").loading).toBe(false);
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("Statistic switches between regular and countdown modes", () => {
    const first = renderTarget(Statistic, {
      value: { path: "/amount" }, title: "Amount", precision: 2, suffix: "元", valueStyle: { color: "red" },
    }, { dataModel: { amount: 12 } });
    expect(lastProps("Statistic")).toMatchObject({ value: 12, precision: 2, suffix: "元" });
    first.unmount();

    renderTarget(Statistic, { isCountdown: true, content: 1000, format: "HH:mm:ss" });
    expect(lastProps("Statistic.Timer")).toMatchObject({ type: "countdown", value: 1000, format: "HH:mm:ss" });
  });

  it("StepIndicator maps all statuses", () => {
    renderTarget(StepIndicator, {
      current: 1,
      direction: "vertical",
      steps: [
        { id: "a", title: "A", status: "success" },
        { id: "b", title: "B", status: "running" },
        { id: "c", title: "C", status: "pending" },
        { id: "d", title: "D", status: "error" },
        { id: "e", title: "E", status: "unknown" },
      ],
    });
    expect(lastProps("Steps").items.map((item: any) => item.status)).toEqual([
      "finish", "process", "wait", "error", "wait",
    ]);
  });

  it("Table transforms templates, checkbox, tag and component columns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderTarget(Table, {
      data: { path: "/rows" },
      pagination: true,
      emptyText: "Empty",
      columns: [
        { title: "Name", dataIndex: "name", template: "${$current.name}!" },
        { title: "Enabled", dataIndex: "enabled", renderAs: "checkbox" },
        { title: "Status", dataIndex: "status", renderAs: "tag", statusColors: { ok: "green" } },
        { title: "Custom", dataIndex: "name", component: "child" },
        { title: "Missing", dataIndex: "name", component: "missing" },
      ],
    }, { dataModel: { rows: [{ id: 1, name: "Ann", enabled: true, status: "ok" }] } });

    const props = lastProps("Table");
    const record = props.dataSource[0];
    expect(props.columns[0].render("Ann", record)).toBe("Ann!");
    render(props.columns[1].render(true, record));
    expect(lastProps("Checkbox")).toMatchObject({ checked: true, disabled: true });
    render(props.columns[2].render("ok", record));
    expect(lastProps("Tag").color).toBe("green");
    render(
      <RendererContextProvider dataModel={{}} componentRegistry={{ "text-probe": TextProbe }}>
        {props.columns[3].render("Ann", record)}
      </RendererContextProvider>,
    );
    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(props.columns[4].render("Ann", record)).toBeNull();
    expect(warn).toHaveBeenCalledWith("Component not found for column.component: missing");
    expect(props.pagination).toEqual({});
  });

  it("Timeline supports bound items, pending state and component children", () => {
    const first = renderTarget(Timeline, {
      data: { path: "/events" }, pending: "Loading", reverse: true,
    }, { dataModel: { events: [{ label: "Created", content: "Done", color: "green" }] } });
    expect(lastProps("Timeline").items).toHaveLength(2);
    first.unmount();

    renderTarget(Timeline, { children: ["child", "missing"] });
    expect(lastProps("Timeline").items).toHaveLength(1);
  });

  it("Typography renders all variants, recursive items and child components", () => {
    const variants = ["title", "paragraph", "link", "text"];
    for (const variant of variants) {
      const view = renderTarget(Typography, {
        variant,
        content: "Text",
        href: "/docs",
        target: "_blank",
        level: 2,
        strong: true,
      });
      const name = `Typography.${variant[0].toUpperCase()}${variant.slice(1)}`;
      expect(lastProps(name)).toBeDefined();
      view.unmount();
    }

    const items = renderTarget(Typography, {
      items: [{ variant: "text", content: "Nested" }],
    });
    expect(lastProps("Typography.Text")).toBeDefined();
    items.unmount();

    renderTarget(Typography, { children: ["child", "missing"] });
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("Watermark normalizes bound content and numeric arrays", () => {
    renderTarget(Watermark, {
      value: { path: "/watermark" },
      image: "/logo.png",
      imageWidth: 120,
      imageHeight: 60,
      gap: [10, "20"],
      offset: [1, 2],
      children: ["child", "missing"],
    }, { dataModel: { watermark: ["A", "B"] } });
    expect(lastProps("Watermark")).toMatchObject({
      content: ["A", "B"], image: "/logo.png", width: 120, height: 60, gap: [10, 20], offset: [1, 2],
    });
  });
});

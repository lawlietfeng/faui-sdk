import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const antdMock = vi.hoisted(() => ({
  calls: {} as Record<string, any[]>,
}));

vi.mock("antd", async () => {
  const ReactModule = await import("react");
  const make = (name: string) => {
    const Component = ReactModule.forwardRef<any, any>((props, ref) => {
      antdMock.calls[name] = [...(antdMock.calls[name] ?? []), props];
      ReactModule.useImperativeHandle(ref, () => ({ goTo: vi.fn() }));
      const itemChildren = Array.isArray(props.items)
        ? props.items.map((item: any) => item?.children).filter(ReactModule.isValidElement)
        : null;
      return ReactModule.createElement(
        "div",
        { "data-antd": name },
        props.children,
        itemChildren,
      );
    });
    Component.displayName = name;
    return Component;
  };

  const App = make("App") as any;
  App.useApp = () => ({
    message: {},
    notification: {},
  });

  const messageApi = {
    success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), loading: vi.fn(),
    open: vi.fn(), config: vi.fn(),
  };
  const notificationApi = {
    success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(),
    open: vi.fn(), config: vi.fn(),
  };

  return {
    App,
    message: messageApi,
    notification: notificationApi,
    Modal: make("Modal"),
    Drawer: make("Drawer"),
    Popover: make("Popover"),
    Tooltip: make("Tooltip"),
    Popconfirm: make("Popconfirm"),
    Dropdown: make("Dropdown"),
    Pagination: make("Pagination"),
    Menu: make("Menu"),
    Tree: make("Tree"),
    Tour: make("Tour"),
    Steps: make("Steps"),
    Tabs: make("Tabs"),
  };
});

vi.mock("@ant-design/icons", () => ({
  HomeOutlined: () => <span>home-icon</span>,
  MissingIcon: undefined,
}));

import type { Component, ActionConfig } from "../../src/types/schema";
import { RendererContextProvider } from "../../src/context/RendererContext";
import { Modal } from "../../src/components/Modal";
import { Drawer } from "../../src/components/Drawer";
import { Popover } from "../../src/components/Popover";
import { Tooltip } from "../../src/components/Tooltip";
import { Popconfirm } from "../../src/components/Popconfirm";
import { Dropdown } from "../../src/components/Dropdown";
import { Pagination } from "../../src/components/Pagination";
import { Menu } from "../../src/components/Menu";
import { Tree } from "../../src/components/Tree";
import { Tour } from "../../src/components/Tour";
import { Steps } from "../../src/components/Steps";
import { Tabs } from "../../src/components/Tabs";

const Probe: React.FC<{ config: Component }> = ({ config }) => <span>{config.content}</span>;
const child = { id: "child", component: "probe", content: "child-content" } as Component;

function lastProps(name: string): any {
  const calls = antdMock.calls[name];
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
  const componentMap = new Map<string, Component>([["root", root], ["child", child]]);
  return render(
    <RendererContextProvider
      dataModel={options.dataModel ?? { open: true, current: 1 }}
      componentRegistry={{ probe: Probe }}
      onAction={options.onAction}
    >
      <ComponentType config={root} componentMap={componentMap} />
    </RendererContextProvider>,
  );
}

beforeEach(() => {
  antdMock.calls = {};
});

describe("overlay component interactions", () => {
  it("Modal writes bound state and executes custom cancel and confirm actions", async () => {
    const onAction = vi.fn();
    renderTarget(Modal, {
      open: { path: "/open" },
      title: "Confirm",
      footer: false,
      maskClosable: false,
      children: ["child", "missing"],
      on_cancel: [
        { action: "update_data", path: "/cancelled", value: true },
        { action: "update_data", path: "/logged", value: true },
      ],
      on_ok: { action: "update_data", path: "/confirmed", value: true },
    }, { onAction });

    expect(lastProps("Modal")).toMatchObject({ open: true, footer: null, mask: { closable: false } });
    act(() => lastProps("Modal").onCancel());
    act(() => lastProps("Modal").onOk());

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(4));
    expect(onAction.mock.calls.map(([action]) => action.path)).toEqual([
      "/open", "/cancelled", "/logged", "/confirmed",
    ]);
  });

  it("Modal defaults OK to closing bound state", async () => {
    const onAction = vi.fn();
    renderTarget(Modal, { open: { path: "/open" }, mask: false }, { onAction });

    act(() => lastProps("Modal").onOk());

    await waitFor(() => expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/open", value: false }),
      expect.anything(),
    ));
    expect(lastProps("Modal").mask).toBe(false);
  });

  it("Drawer selects size by placement and closes with custom actions", async () => {
    const onAction = vi.fn();
    renderTarget(Drawer, {
      open: { path: "/open" },
      placement: "top",
      height: 320,
      width: 480,
      maskClosable: true,
      children: ["child", "missing"],
      on_close: [
        { action: "update_data", path: "/closed", value: true },
        { action: "update_data", path: "/tracked", value: true },
      ],
    }, { onAction });

    expect(lastProps("Drawer")).toMatchObject({ size: 320, mask: { closable: true } });
    act(() => lastProps("Drawer").onClose());

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(3));
  });

  it("Popover and Tooltip handle controlled open changes", async () => {
    const onAction = vi.fn();
    renderTarget(Popover, {
      open: { path: "/open" },
      children: ["child", "missing"],
      on_open_change: [
        { action: "update_data", path: "/popoverEvent", value: true },
      ],
    }, { onAction });
    expect(lastProps("Popover").open).toBe(true);
    act(() => lastProps("Popover").onOpenChange(false));

    renderTarget(Tooltip, {
      open: { path: "/open" },
      title: "Tip",
      children: ["child", "missing"],
    }, { onAction });
    expect(lastProps("Tooltip").open).toBe(true);
    act(() => lastProps("Tooltip").onOpenChange(false));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(3));
  });

  it("Popconfirm executes confirm and cancel sequences and stops propagation", async () => {
    const onAction = vi.fn();
    const stopPropagation = vi.fn();
    renderTarget(Popconfirm, {
      children: ["child", "missing"],
      on_confirm: [
        { action: "update_data", path: "/confirm1", value: true },
        { action: "update_data", path: "/confirm2", value: true },
      ],
      on_cancel: { action: "update_data", path: "/cancel", value: true },
    }, { onAction });

    act(() => lastProps("Popconfirm").onConfirm({ stopPropagation }));
    act(() => lastProps("Popconfirm").onCancel({ stopPropagation }));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(3));
    expect(stopPropagation).toHaveBeenCalledTimes(2);
    expect(lastProps("Popconfirm").title).toBe("确定要执行此操作吗？");
  });
});

describe("navigation and data component interactions", () => {
  it("Dropdown converts items and writes open and selected state", async () => {
    const onAction = vi.fn();
    renderTarget(Dropdown, {
      open: { path: "/open" },
      selectedKeys: { path: "/selected" },
      children: ["child", "missing"],
      items: [
        { type: "divider" },
        { key: "parent", label: "Parent", icon: "child", children: [{ key: "nested", label: "Nested" }] },
      ],
      on_open_change: { action: "update_data", path: "/openEvent", value: true, payload: { fixed: true } },
      on_menu_click: { action: "update_data", path: "/menuEvent", value: true },
    }, { dataModel: { open: false, selected: ["old"] }, onAction });

    const props = lastProps("Dropdown");
    expect(props.menu.items).toHaveLength(2);
    expect(props.menu.items[1].children[0].key).toBe("nested");
    act(() => props.onOpenChange(true));
    act(() => props.menu.onClick({ key: "nested", keyPath: ["nested", "parent"] }));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(4));
    expect(onAction.mock.calls[1][0].payload).toEqual({ fixed: true, open: true });
    expect(onAction.mock.calls[3][0].payload).toEqual({ key: "nested", keyPath: ["nested", "parent"] });
  });

  it("Pagination writes bindings, invokes custom actions and formats totals", async () => {
    const onAction = vi.fn();
    renderTarget(Pagination, {
      current: { path: "/page" },
      pageSize: { path: "/size" },
      total: 42,
      showTotal: "共 ${total} 条，当前 ${range[0]}-${range[1]}",
      on_change: { action: "update_data", path: "/changed", value: true, payload: { fixed: true } },
    }, { dataModel: { page: 1, size: 10 }, onAction });

    const props = lastProps("Pagination");
    expect(props.showTotal(42, [11, 20])).toBe("共 42 条，当前 11-20");
    act(() => props.onChange(2, 20));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(3));
    expect(onAction.mock.calls[2][0].payload).toEqual({ fixed: true, current: 2, pageSize: 20 });
  });

  it("Menu transforms nested items and dispatches every interaction", async () => {
    const onAction = vi.fn();
    renderTarget(Menu, {
      items: [
        { key: "home", label: "Home", icon: "HomeOutlined" },
        { key: "missing", label: "Missing", icon: "MissingIcon" },
        { key: "group", label: "Group", children: [{ key: "child", label: "Child" }] },
      ],
      mode: "inline",
      inlineCollapsed: true,
      selectedKeys: { path: "/selected" },
      openKeys: { path: "/openKeys" },
      on_click: { action: "update_data", path: "/clicked", value: true },
      on_select: { action: "update_data", path: "/selectedEvent", value: true },
      on_open_change: { action: "update_data", path: "/openEvent", value: true },
    }, { dataModel: { selected: ["home"], openKeys: ["group"] }, onAction });

    const props = lastProps("Menu");
    expect(props.items[2].children[0].key).toBe("child");
    act(() => props.onSelect({ selectedKeys: ["child"], key: "child", keyPath: ["child", "group"] }));
    act(() => props.onDeselect({ selectedKeys: [] }));
    act(() => props.onClick({ key: "home", keyPath: ["home"] }));
    act(() => props.onOpenChange(["group"]));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(5));
  });

  it("Tree writes default bindings and executes custom handlers", async () => {
    const onAction = vi.fn();
    renderTarget(Tree, {
      treeData: [{ key: "1", title: "One" }],
      checkedKeys: { path: "/checked" },
      selectedKeys: { path: "/selected" },
      expandedKeys: { path: "/expanded" },
      checkable: true,
    }, { dataModel: { checked: [], selected: [], expanded: [] }, onAction });
    let props = lastProps("Tree");
    act(() => props.onCheck(["1"], { checked: true }));
    act(() => props.onSelect(["1"], { selected: true }));
    act(() => props.onExpand(["1"], { expanded: true }));

    renderTarget(Tree, {
      treeData: "invalid",
      on_check: { action: "update_data", path: "/checkEvent" },
      on_select: { action: "update_data", path: "/selectEvent" },
      on_expand: { action: "update_data", path: "/expandEvent" },
    }, { onAction });
    props = lastProps("Tree");
    act(() => props.onCheck(["2"], {}));
    act(() => props.onSelect(["2"], {}));
    act(() => props.onExpand(["2"], {}));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(6));
    expect(props.treeData).toEqual([]);
  });

  it("Tour, Steps and Tabs update bindings and custom actions", async () => {
    const onAction = vi.fn();
    const target = document.createElement("div");
    target.id = "tour-target";
    document.body.appendChild(target);

    renderTarget(Tour, {
      open: { path: "/open" },
      current: { path: "/current" },
      steps: [{ title: "Step", target: "#tour-target", cover: "/cover.png" }],
    }, { onAction });
    const tourProps = lastProps("Tour");
    expect(tourProps.steps[0].target()).toBe(target);
    act(() => tourProps.onClose());
    act(() => tourProps.onChange(2));

    renderTarget(Steps, {
      current: { path: "/current" },
      items: [{ title: "One" }],
      progressDot: true,
      on_change: { action: "update_data", path: "/stepEvent" },
    }, { onAction });
    const stepsProps = lastProps("Steps");
    expect(stepsProps.type).toBe("dot");
    act(() => stepsProps.onChange(3));

    renderTarget(Tabs, {
      activeKey: { path: "/tab" },
      tabPlacement: "left",
      items: [{ key: "a", label: "Tab A", children: ["child", "missing"] }],
      on_change: { action: "update_data", path: "/tabEvent" },
    }, { dataModel: { tab: "a" }, onAction });
    const tabsProps = lastProps("Tabs");
    expect(tabsProps.tabPlacement).toBe("start");
    act(() => tabsProps.onChange("b"));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(5));
  });
});

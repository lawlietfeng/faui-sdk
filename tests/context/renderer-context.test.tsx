import React, { useEffect } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  RendererContextProvider,
  RendererContextScope,
  useRendererContext,
} from "../../src/context/RendererContext";

const registry = {};

describe("RendererContext", () => {
  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useRendererContext())).toThrow(
      "useRendererContext must be used within RendererContextProvider",
    );
  });

  it("merges schema data with initial data and exposes data operations", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RendererContextProvider
        dataModel={{ user: { name: "schema" }, source: "schema" }}
        initialData={{ user: { name: "initial" }, extra: true }}
        componentRegistry={registry}
      >
        {children}
      </RendererContextProvider>
    );
    const { result } = renderHook(() => useRendererContext(), { wrapper });

    expect(result.current.getDataModel()).toEqual({
      user: { name: "initial" },
      source: "schema",
      extra: true,
    });
    expect(result.current.getData("/user/name")).toBe("initial");

    act(() => result.current.updateData("/user/name", "updated"));

    expect(result.current.getData("/user/name")).toBe("updated");
    expect(result.current.dataModel).toEqual({
      user: { name: "updated" },
      source: "schema",
      extra: true,
    });
  });

  it("merges live data into the latest snapshot", () => {
    let liveData: Record<string, unknown> | undefined;
    const dataModel = { count: 1, stable: true };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RendererContextProvider
        dataModel={dataModel}
        liveData={liveData}
        componentRegistry={registry}
      >
        {children}
      </RendererContextProvider>
    );
    const { result, rerender } = renderHook(() => useRendererContext(), { wrapper });

    act(() => result.current.updateData("/local", "kept"));
    liveData = { count: 2, remote: true };
    rerender();

    expect(result.current.getDataModel()).toEqual({
      count: 2,
      stable: true,
      local: "kept",
      remote: true,
    });
  });

  it("resets data and scope values when base inputs change", () => {
    let dataModel: Record<string, unknown> = { version: 1 };
    let initialData: Record<string, unknown> = { local: "one" };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RendererContextProvider
        dataModel={dataModel}
        initialData={initialData}
        componentRegistry={registry}
      >
        {children}
      </RendererContextProvider>
    );
    const { result, rerender } = renderHook(() => useRendererContext(), { wrapper });

    act(() => {
      result.current.updateData("/temporary", true);
      result.current.setCurrent("current");
      result.current.setParent("parent");
    });

    dataModel = { version: 2 };
    initialData = { local: "two" };
    rerender();

    expect(result.current.getDataModel()).toEqual({ version: 2, local: "two" });
    expect(result.current.$current).toBeNull();
    expect(result.current.$parent).toBeNull();
  });

  it("notifies path and global subscribers", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RendererContextProvider dataModel={{ user: { name: "Ann" } }} componentRegistry={registry}>
        {children}
      </RendererContextProvider>
    );
    const { result } = renderHook(() => useRendererContext(), { wrapper });
    const pathListener = vi.fn();
    const globalListener = vi.fn();
    const unsubscribePath = result.current.subscribeData("/user", pathListener);
    const unsubscribeGlobal = result.current.subscribeData(globalListener);

    act(() => result.current.updateData("/user/name", "Bob"));
    unsubscribePath();
    unsubscribeGlobal();

    expect(pathListener).toHaveBeenCalledTimes(1);
    expect(globalListener).toHaveBeenCalledTimes(1);
  });

  it("runs action sequences with onAction and fresh context", async () => {
    const onAction = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RendererContextProvider
        dataModel={{ count: 1 }}
        componentRegistry={registry}
        onAction={onAction}
      >
        {children}
      </RendererContextProvider>
    );
    const { result } = renderHook(() => useRendererContext(), { wrapper });

    await act(async () => {
      await result.current.handleAction([
        { action: "update_data", path: "/count", value: 2, payload: { source: "first" } },
        { action: "update_data", path: "/done", value: true },
      ], { event: "change" });
    });

    expect(result.current.getDataModel()).toEqual({ count: 2, done: true });
    expect(onAction).toHaveBeenNthCalledWith(1, expect.objectContaining({ path: "/count" }), {
      $root: { count: 1 },
      $current: null,
      $parent: null,
      source: "first",
      event: "change",
    });
    expect(onAction).toHaveBeenNthCalledWith(2, expect.objectContaining({ path: "/done" }), {
      $root: { count: 2 },
      $current: null,
      $parent: null,
      event: "change",
    });
  });
});

describe("RendererContextScope", () => {
  it("resolves relative reads, writes and action paths", async () => {
    let scopedContext: ReturnType<typeof useRendererContext> | undefined;

    function Probe() {
      const context = useRendererContext();
      useEffect(() => {
        scopedContext = context;
      }, [context]);
      return null;
    }

    renderHook(() => useRendererContext(), {
      wrapper: ({ children }) => (
        <RendererContextProvider
          dataModel={{ items: [{ name: "Ann" }] }}
          componentRegistry={registry}
        >
          <RendererContextScope
            $current={{ name: "Ann" }}
            $parent={[{ name: "Ann" }]}
            $scopePath="/items/0"
          >
            <Probe />
            {children}
          </RendererContextScope>
        </RendererContextProvider>
      ),
    });

    expect(scopedContext?.getData("./name")).toBe("Ann");
    expect(scopedContext?.$scopePath).toBe("/items/0");
    expect(scopedContext?.$current).toEqual({ name: "Ann" });

    act(() => scopedContext?.updateData("./name", "Bob"));
    expect(scopedContext?.getData("./name")).toBe("Bob");

    await act(async () => {
      await scopedContext?.handleAction({
        action: "update_data",
        path: "./name",
        value: "Carol",
      });
    });
    expect(scopedContext?.getData("./name")).toBe("Carol");
  });

  it("keeps absolute paths and resolves an empty relative path to the scope root", () => {
    let context: ReturnType<typeof useRendererContext> | undefined;
    function Probe() {
      context = useRendererContext();
      return null;
    }

    renderHook(() => useRendererContext(), {
      wrapper: ({ children }) => (
        <RendererContextProvider
          dataModel={{ items: [{ value: 1 }], global: true }}
          componentRegistry={registry}
        >
          <RendererContextScope $scopePath="/items/0">
            <Probe />
            {children}
          </RendererContextScope>
        </RendererContextProvider>
      ),
    });

    expect(context?.getData("./")).toEqual({ value: 1 });
    expect(context?.getData("/global")).toBe(true);
  });
});

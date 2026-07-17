import React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RendererContextProvider } from "../../src/context/RendererContext";
import { useAction } from "../../src/hooks/useAction";
import { useDataModel } from "../../src/hooks/useDataModel";
import type { ActionConfig, ActionContext } from "../../src/types/schema";

function createWrapper(
  onAction?: (action: ActionConfig, context: ActionContext) => void | Promise<void>,
) {
  const dataModel = { user: { name: "Ann" } };
  return ({ children }: { children: React.ReactNode }) => (
    <RendererContextProvider
      dataModel={dataModel}
      componentRegistry={{}}
      onAction={onAction}
    >
      {children}
    </RendererContextProvider>
  );
}

describe("renderer hooks", () => {
  it("useDataModel reads and updates values", () => {
    const { result } = renderHook(() => useDataModel(), { wrapper: createWrapper() });

    expect(result.current.dataModel).toEqual({ user: { name: "Ann" } });
    expect(result.current.getValue("/user/name")).toBe("Ann");

    act(() => result.current.setValue("/user/name", "Bob"));

    expect(result.current.getValue("/user/name")).toBe("Bob");
  });

  it("useAction executes a single action with extra context", async () => {
    const onAction = vi.fn();
    const { result } = renderHook(() => useAction(), {
      wrapper: createWrapper(onAction as (action: ActionConfig, context: ActionContext) => Promise<void>),
    });

    await act(async () => {
      await result.current.execute(
        { action: "update_data", path: "/saved", value: true },
        { event: "submit" },
      );
    });

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update_data", path: "/saved" }),
      expect.objectContaining({ event: "submit" }),
    );
  });

  it("useAction executes action arrays sequentially", async () => {
    const order: string[] = [];
    const onAction = vi.fn(async (action: ActionConfig) => {
      order.push(action.path ?? "");
    });
    const { result } = renderHook(() => useAction(), { wrapper: createWrapper(onAction) });

    await act(async () => {
      await result.current.execute([
        { action: "update_data", path: "/first", value: 1 },
        { action: "update_data", path: "/second", value: 2 },
      ]);
    });

    expect(order).toEqual(["/first", "/second"]);
  });
});

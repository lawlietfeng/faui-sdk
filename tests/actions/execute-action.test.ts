import { afterEach, describe, expect, it, vi } from "vitest";
import type { ActionConfig, ActionExecutor } from "../../src/types/schema";
import { ActionRegistry, executeAction } from "../../src/actions";

function createExecutor(): ActionExecutor {
  return {
    updateData: vi.fn(),
    getData: vi.fn(),
    context: { $root: {} },
  };
}

afterEach(() => {
  delete ActionRegistry.test_success;
  delete ActionRegistry.test_failure;
  delete ActionRegistry.test_capture;
});

describe("executeAction", () => {
  it("warns for unknown actions", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await executeAction({ action: "unknown" } as unknown as ActionConfig, createExecutor());

    expect(warn).toHaveBeenCalledWith("Unknown action type: unknown");
  });

  it("executes success actions in order and passes $result", async () => {
    const order: string[] = [];
    ActionRegistry.test_success = vi.fn(async () => {
      order.push("source");
      return { id: 1 };
    });
    ActionRegistry.test_capture = vi.fn(async (_action, executor) => {
      order.push(String(_action.value));
      expect(executor.context.$result).toEqual({ id: 1 });
    });

    await executeAction({
      action: "test_success",
      on_success: [
        { action: "test_capture", value: "first" },
        { action: "test_capture", value: "second" },
      ],
    } as unknown as ActionConfig, createExecutor());

    expect(order).toEqual(["source", "first", "second"]);
  });

  it("executes error actions in order and passes the error message", async () => {
    const messages: unknown[] = [];
    ActionRegistry.test_failure = vi.fn(async () => {
      throw new Error("request failed");
    });
    ActionRegistry.test_capture = vi.fn(async (_action, executor) => {
      messages.push(executor.context.$error);
    });

    await executeAction({
      action: "test_failure",
      on_error: [
        { action: "test_capture" },
        { action: "test_capture" },
      ],
    } as unknown as ActionConfig, createExecutor());

    expect(messages).toEqual(["request failed", "request failed"]);
  });

  it("logs an unhandled action failure", async () => {
    ActionRegistry.test_failure = vi.fn(async () => {
      throw "plain failure";
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await executeAction({ action: "test_failure" } as unknown as ActionConfig, createExecutor());

    expect(error).toHaveBeenCalledWith("Action \"test_failure\" failed:", "plain failure");
  });
});

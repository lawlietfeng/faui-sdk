import { describe, expect, it, vi } from "vitest";
import type { ActionExecutor } from "../../src/types/schema";
import { httpProxyAction } from "../../src/actions/httpProxy";

function createExecutor(overrides: Partial<ActionExecutor> = {}): ActionExecutor {
  return {
    updateData: vi.fn(),
    getData: vi.fn((path: string) => path === "/form" ? { name: "Ann" } : undefined),
    httpRequest: vi.fn().mockResolvedValue({ ok: true }),
    context: {
      $root: { id: 7 },
      $current: { amount: 2 },
      $parent: null,
    },
    ...overrides,
  };
}

describe("httpProxyAction", () => {
  it("warns when the HTTP configuration is missing", async () => {
    const executor = createExecutor();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await httpProxyAction({ action: "http_proxy" }, executor);

    expect(warn).toHaveBeenCalledWith("http_proxy action requires http_config in payload");
    expect(executor.httpRequest).not.toHaveBeenCalled();
  });

  it("evaluates URL and nested request body values", async () => {
    const executor = createExecutor();

    const result = await httpProxyAction({
      action: "http_proxy",
      payload: {
        http_config: {
          method: "POST",
          path: "/users/${$root.id}",
          headers: { authorization: "token" },
        },
        http_body: {
          form: { path: "/form" },
          amount: "${$current.amount}",
          tags: ["fixed", "${$root.id}"],
        },
      },
    }, executor);

    expect(executor.httpRequest).toHaveBeenCalledWith({
      method: "POST",
      url: "/users/7",
      headers: { authorization: "token" },
      body: {
        form: { name: "Ann" },
        amount: 2,
        tags: ["fixed", 7],
      },
    });
    expect(result).toEqual({ ok: true });
  });

  it.each([false, 0, ""])("preserves a valid falsy request body: %p", async (body) => {
    const executor = createExecutor();

    await httpProxyAction({
      action: "http_proxy",
      payload: {
        http_config: { method: "POST", path: "/values" },
        http_body: body,
      },
    }, executor);

    expect(executor.httpRequest).toHaveBeenCalledWith({
      method: "POST",
      url: "/values",
      headers: {},
      body,
    });
  });

  it("warns and returns when no request implementation was provided", async () => {
    const executor = createExecutor({ httpRequest: undefined });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await httpProxyAction({
      action: "http_proxy",
      payload: { http_config: { method: "GET", path: "/users" } },
    }, executor);

    expect(result).toBeUndefined();
    expect(warn).toHaveBeenCalledWith("httpRequest not provided");
  });
});

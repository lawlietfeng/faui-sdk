import { describe, expect, it, vi } from "vitest";

describe("injectFauiStyles", () => {
  it("injects the FAUI stylesheet only once", async () => {
    document.querySelectorAll("#faui-styles").forEach((node) => node.remove());
    vi.resetModules();
    const { injectFauiStyles } = await import("../../src/utils/injectStyles");

    injectFauiStyles();
    injectFauiStyles();

    const styles = document.querySelectorAll("#faui-styles");
    expect(styles).toHaveLength(1);
    expect(styles[0]).toHaveTextContent(".faui-repeater");
    expect(document.head.firstElementChild).toBe(styles[0]);
  });
});

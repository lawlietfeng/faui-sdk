import { describe, expect, it } from "vitest";
import { resolveOnChange } from "../../src/utils/resolveOnChange";

describe("resolveOnChange", () => {
  it("adds the component value to an action without an explicit value", () => {
    const [actions, extra] = resolveOnChange(
      { action: "update_data", path: "/name" },
      "Ann",
    );

    expect(actions).toEqual([{ action: "update_data", path: "/name", value: "Ann" }]);
    expect(extra).toEqual({ $value: "Ann" });
  });

  it("preserves explicit values and action order", () => {
    const source = [
      { action: "update_data" as const, path: "/first", value: "fixed" },
      { action: "update_data" as const, path: "/second" },
    ];

    const [actions, extra] = resolveOnChange(source, false);

    expect(actions).toEqual([
      { action: "update_data", path: "/first", value: "fixed" },
      { action: "update_data", path: "/second", value: false },
    ]);
    expect(extra).toEqual({ $value: false });
    expect(source[1]).not.toHaveProperty("value");
  });
});

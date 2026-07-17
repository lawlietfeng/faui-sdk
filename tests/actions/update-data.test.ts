import { describe, expect, it, vi } from "vitest";
import type { ActionExecutor } from "../../src/types/schema";
import { updateDataAction } from "../../src/actions/updateData";

function createExecutor(): ActionExecutor {
  return {
    updateData: vi.fn(),
    getData: vi.fn(),
    context: {
      $root: { user: { name: "Ann" } },
      $current: { amount: 2 },
      $parent: null,
      suffix: "!",
    },
  };
}

describe("updateDataAction", () => {
  it("warns and does not update when path is missing", async () => {
    const executor = createExecutor();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await updateDataAction({ action: "update_data", value: 1 }, executor);

    expect(warn).toHaveBeenCalledWith("update_data action requires path");
    expect(executor.updateData).not.toHaveBeenCalled();
  });

  it("evaluates strings, arrays and nested objects", async () => {
    const executor = createExecutor();

    await updateDataAction({
      action: "update_data",
      path: "/result",
      value: {
        label: "${$root.user.name}${suffix}",
        values: ["${$current.amount}", null, 3],
      },
    }, executor);

    expect(executor.updateData).toHaveBeenCalledWith("/result", {
      label: "Ann!",
      values: [2, null, 3],
    });
  });

  it("supports the legacy $eval value format", async () => {
    const executor = createExecutor();

    await updateDataAction({
      action: "update_data",
      path: "/name",
      value: { $eval: "$root.user.name" },
    }, executor);

    expect(executor.updateData).toHaveBeenCalledWith("/name", "Ann");
  });

  it("preserves event placeholders for component handlers", async () => {
    const executor = createExecutor();

    await updateDataAction({ action: "update_data", path: "/value", value: "${value}" }, executor);
    await updateDataAction({ action: "update_data", path: "/files", value: "${fileList}" }, executor);

    expect(executor.updateData).toHaveBeenNthCalledWith(1, "/value", "${value}");
    expect(executor.updateData).toHaveBeenNthCalledWith(2, "/files", "${fileList}");
  });
});

import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDataStore, evaluateObject, useDataSelector } from "../../src";
import type { DataStore } from "../../src";

function formatResult(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

interface ExpressionProbeProps<TValue> {
  store: DataStore;
  value: TValue;
  current?: unknown;
  parent?: unknown;
}

function ExpressionProbe<TValue>({ store, value, current, parent }: ExpressionProbeProps<TValue>) {
  const root = useDataSelector<Record<string, unknown>>(store, "/") ?? {};
  const result = evaluateObject(value, {
    $root: root,
    $current: current,
    $parent: parent
  });

  return <div data-testid="value">{formatResult(result)}</div>;
}

describe("expression and data selector integration", () => {
  it("reevaluates component-like props after subscribed data changes", () => {
    const store = createDataStore({
      user: { name: "Ann", age: 18 },
      settings: { readonly: false }
    });
    const props = {
      title: "用户：${user.name}",
      disabled: "${settings.readonly}",
      status: "${user.age >= 18 ? \"adult\" : \"minor\"}"
    };

    render(<ExpressionProbe store={store} value={props} />);

    expect(screen.getByTestId("value")).toHaveTextContent(
      JSON.stringify({
        title: "用户：Ann",
        disabled: false,
        status: "adult"
      })
    );

    act(() => {
      store.setByPath("/user/name", "Bob");
      store.setByPath("/settings/readonly", true);
    });

    expect(screen.getByTestId("value")).toHaveTextContent(
      JSON.stringify({
        title: "用户：Bob",
        disabled: true,
        status: "adult"
      })
    );
  });

  it("supports $root, $current and $parent in repeated item context", () => {
    const store = createDataStore({
      order: { currency: "CNY" }
    });
    const props = {
      label: "${$current.name}",
      amount: "${$current.price * $current.quantity}",
      parentName: "${$parent.title}",
      currency: "${$root.order.currency}"
    };

    render(
      <ExpressionProbe
        store={store}
        value={props}
        current={{ name: "Line A", price: 12, quantity: 3 }}
        parent={{ title: "Order" }}
      />
    );

    expect(screen.getByTestId("value")).toHaveTextContent(
      JSON.stringify({
        label: "Line A",
        amount: 36,
        parentName: "Order",
        currency: "CNY"
      })
    );
  });

  it("keeps expression fallback stable after unrelated subscription updates", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const store = createDataStore({
      user: { name: "Ann" },
      settings: { theme: "light" }
    });
    const expression = "${user.profile.fullName.toUpperCase()}";

    render(<ExpressionProbe store={store} value={expression} />);

    expect(screen.getByTestId("value")).toHaveTextContent(expression);

    act(() => {
      store.setByPath("/settings/theme", "dark");
    });

    expect(screen.getByTestId("value")).toHaveTextContent(expression);

    error.mockRestore();
  });
});

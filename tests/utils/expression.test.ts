import { describe, expect, it, vi } from "vitest";
import { evaluateExpression, evaluateObject } from "../../src";

describe("evaluateExpression", () => {
  it("returns the input unchanged when there is no interpolation", () => {
    expect(evaluateExpression("plain text", { $root: {} })).toBe("plain text");
    expect(evaluateExpression("", { $root: {} })).toBe("");
  });

  it("evaluates a single pure expression and preserves the original type", () => {
    expect(evaluateExpression("${1 + 2}", { $root: {} })).toBe(3);
    expect(evaluateExpression("${true && false}", { $root: {} })).toBe(false);
    expect(evaluateExpression("${[1, 2, 3]}", { $root: {} })).toEqual([1, 2, 3]);
  });

  it("interpolates mixed text into a string", () => {
    const context = { $root: { price: 10, quantity: 3 } };

    expect(evaluateExpression("总价: ${price * quantity}", context)).toBe("总价: 30");
  });

  it("evaluates ternary expressions", () => {
    const context = { $root: { loading: false, status: "active" } };

    expect(evaluateExpression("${loading ? \"加载中\" : \"就绪\"}", context)).toBe("就绪");
    expect(evaluateExpression("${status === \"active\" ? \"green\" : \"gray\"}", context)).toBe("green");
  });

  it("exposes $root, $current and $parent", () => {
    const context = {
      $root: { user: { name: "Ann" }, count: 5 },
      $current: { id: 1 },
      $parent: { id: 0 }
    };

    expect(evaluateExpression("${$root.user.name}", context)).toBe("Ann");
    expect(evaluateExpression("${count > 0}", context)).toBe(true);
    expect(evaluateExpression("${$current.id}", context)).toBe(1);
    expect(evaluateExpression("${$parent.id}", context)).toBe(0);
  });

  it("provides the minimal helper functions", () => {
    expect(evaluateExpression("${upper(\"ab\")}", { $root: {} })).toBe("AB");
    expect(evaluateExpression("${lower(\"AB\")}", { $root: {} })).toBe("ab");
    expect(evaluateExpression("${isEmpty(\"\")}", { $root: {} })).toBe(true);
    expect(evaluateExpression("${isEmpty([1])}", { $root: {} })).toBe(false);
    expect(evaluateExpression("${sum([1, 2, 3])}", { $root: {} })).toBe(6);
  });

  it("supports common safe built-ins", () => {
    expect(evaluateExpression("${Math.max(1, 9, 4)}", { $root: {} })).toBe(9);
    expect(evaluateExpression("${Number(\"2\") + 3}", { $root: {} })).toBe(5);
  });

  it("returns the original expression on evaluation errors", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const expression = "${missing.deep.path}";

    expect(evaluateExpression(expression, { $root: {} })).toBe(expression);

    error.mockRestore();
  });

  it("returns the original text when interpolation syntax is invalid", () => {
    expect(evaluateExpression("Hello ${name", { $root: { name: "Ann" } })).toBe("Hello ${name");
    expect(evaluateExpression("Hello ${}", { $root: { name: "Ann" } })).toBe("Hello ${}");
  });

  it("blocks dangerous property names before evaluation", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const expressions = [
      "${user.constructor}",
      "${user.__proto__}",
      "${user.prototype}",
      "${({}).constructor.constructor(\"return 1\")()}"
    ];

    for (const expression of expressions) {
      expect(evaluateExpression(expression, { $root: { user: { name: "x" } } })).toBe(expression);
    }

    warn.mockRestore();
  });

  it("shadows dangerous globals", () => {
    for (const globalName of ["window", "document", "globalThis", "process", "eval", "Function"]) {
      expect(evaluateExpression(`\${typeof ${globalName}}`, { $root: {} })).toBe("undefined");
    }
  });

  it("strips blocked object props through the proxy", () => {
    expect(evaluateExpression("${typeof user.__defineGetter__}", { $root: { user: {} } })).toBe("undefined");
  });
});

describe("evaluateObject", () => {
  it("passes through null, undefined and non-string primitives", () => {
    const context = { $root: {} };

    expect(evaluateObject(null, context)).toBeNull();
    expect(evaluateObject(undefined, context)).toBeUndefined();
    expect(evaluateObject(42, context)).toBe(42);
    expect(evaluateObject(true, context)).toBe(true);
  });

  it("recursively evaluates strings inside nested objects and arrays", () => {
    const context = { $root: { count: 2 } };
    const input = {
      title: "数量 ${count}",
      visible: "${count > 0}",
      list: ["${count + 1}", "static"],
      nested: {
        value: "${count * 10}"
      }
    };

    expect(evaluateObject(input, context)).toEqual({
      title: "数量 2",
      visible: true,
      list: [3, "static"],
      nested: {
        value: 20
      }
    });
  });
});

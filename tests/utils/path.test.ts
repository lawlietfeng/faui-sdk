import { describe, expect, it } from "vitest";
import { getByPath, setByPath } from "../../src/utils/path";

describe("legacy path utilities", () => {
  it("reads roots, nested objects and arrays", () => {
    const data = { user: { name: "Ann" }, items: [{ id: 1 }] };

    expect(getByPath(data, "/")).toBe(data);
    expect(getByPath(data, "")).toBe(data);
    expect(getByPath(data, "/user/name")).toBe("Ann");
    expect(getByPath(data, "/items/0/id")).toBe(1);
    expect(getByPath(data, "/missing/value")).toBeUndefined();
    expect(getByPath(null, "/user/name")).toBeUndefined();
  });

  it("replaces the root without mutating the original value", () => {
    const original = { user: { name: "Ann" } };
    const replacement = { ready: true };

    expect(setByPath(original, "/", replacement)).toBe(replacement);
    expect(original).toEqual({ user: { name: "Ann" } });
  });

  it("clones changed branches and keeps unrelated references", () => {
    const original = {
      user: { name: "Ann", address: { city: "HZ" } },
      settings: { theme: "light" },
    };

    const next = setByPath(original, "/user/address/city", "SH") as typeof original;

    expect(next).not.toBe(original);
    expect(next.user).not.toBe(original.user);
    expect(next.user.address).not.toBe(original.user.address);
    expect(next.settings).toBe(original.settings);
    expect(next.user.address.city).toBe("SH");
    expect(original.user.address.city).toBe("HZ");
  });

  it("creates missing nested objects and clones arrays", () => {
    expect(setByPath({}, "/profile/name", "Ann")).toEqual({ profile: { name: "Ann" } });

    const original = { items: [{ name: "A" }] };
    const next = setByPath(original, "/items/0/name", "B") as typeof original;

    expect(next.items).not.toBe(original.items);
    expect(next.items[0]).not.toBe(original.items[0]);
    expect(next.items[0].name).toBe("B");
  });
});

import { describe, expect, it, vi } from "vitest";
import { createDataStore, getByPath, normalizeDataPath, setByPath } from "../../src";

describe("createDataStore", () => {
  it("reads the initial snapshot and JSON Pointer paths", () => {
    const data = {
      user: { name: "Ann", profile: { age: 18 } },
      items: [{ title: "A" }]
    };
    const store = createDataStore(data);

    expect(store.getSnapshot()).toBe(data);
    expect(store.getByPath()).toBe(data);
    expect(store.getByPath("/")).toBe(data);
    expect(store.getByPath("/user/name")).toBe("Ann");
    expect(store.getByPath("/items/0/title")).toBe("A");
    expect(store.getByPath("/missing/path")).toBeUndefined();
  });

  it("updates a path with immutable references along the changed branch", () => {
    const store = createDataStore({
      user: { name: "Ann", profile: { age: 18 } },
      settings: { theme: "light" }
    });
    const initialSnapshot = store.getSnapshot();
    const initialUser = store.getByPath("/user");
    const initialSettings = store.getByPath("/settings");

    store.setByPath("/user/name", "Bob");

    expect(store.getSnapshot()).not.toBe(initialSnapshot);
    expect(store.getByPath("/user")).not.toBe(initialUser);
    expect(store.getByPath("/settings")).toBe(initialSettings);
    expect(store.getByPath("/user/name")).toBe("Bob");
  });

  it("keeps unrelated object references stable", () => {
    const store = createDataStore({
      user: { name: "Ann", profile: { age: 18 } },
      settings: { theme: "light" }
    });
    const user = store.getByPath("/user");

    store.setByPath("/settings/theme", "dark");

    expect(store.getByPath("/user")).toBe(user);
  });

  it("notifies only affected path subscriptions and global subscriptions", () => {
    const store = createDataStore({
      user: { name: "Ann", profile: { age: 18 } },
      settings: { theme: "light" }
    });
    const nameListener = vi.fn();
    const userListener = vi.fn();
    const settingsListener = vi.fn();
    const globalListener = vi.fn();

    store.subscribe("/user/name", nameListener);
    store.subscribe("/user", userListener);
    store.subscribe("/settings", settingsListener);
    store.subscribe(globalListener);

    store.setByPath("/user/name", "Bob");

    expect(nameListener).toHaveBeenCalledTimes(1);
    expect(userListener).toHaveBeenCalledTimes(1);
    expect(settingsListener).not.toHaveBeenCalled();
    expect(globalListener).toHaveBeenCalledTimes(1);
  });

  it("does not notify after unsubscribe or when the value is unchanged", () => {
    const store = createDataStore({ user: { name: "Ann" } });
    const listener = vi.fn();
    const unsubscribe = store.subscribe("/user/name", listener);

    unsubscribe();
    store.setByPath("/user/name", "Bob");
    store.setByPath("/user/name", "Bob");

    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies a shared listener only once for one update", () => {
    const store = createDataStore({ user: { name: "Ann" } });
    const listener = vi.fn();

    store.subscribe(listener);
    store.subscribe("/user", listener);
    store.subscribe("/user/name", listener);
    store.setByPath("/user/name", "Bob");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("returns a harmless unsubscribe function when a path listener is omitted", () => {
    const store = createDataStore({ ready: false });
    const unsubscribe = (store.subscribe as any)("/ready");

    expect(() => unsubscribe()).not.toThrow();
    store.setByPath("/ready", true);
    expect(store.getByPath("/ready")).toBe(true);
  });

  it("notifies every path subscription when the root is replaced", () => {
    const store = createDataStore({ user: { name: "Ann" }, ready: false });
    const userListener = vi.fn();
    const readyListener = vi.fn();

    store.subscribe("/user/name", userListener);
    store.subscribe("/ready", readyListener);
    store.setByPath("/", { user: { name: "Bob" }, ready: true });

    expect(userListener).toHaveBeenCalledTimes(1);
    expect(readyListener).toHaveBeenCalledTimes(1);
  });

  it("keeps 100 path subscriptions inside the expected update boundary", () => {
    const store = createDataStore({
      items: Array.from({ length: 100 }, (_, index) => ({
        value: index,
        label: `item-${index}`
      }))
    });
    const calls = Array.from({ length: 100 }, () => 0);
    const unsubscribeList = calls.map((_, index) =>
      store.subscribe(`/items/${index}/value`, () => {
        calls[index] += 1;
      })
    );

    store.setByPath("/items/42/value", "updated");
    store.setByPath("/items/42/label", "unchanged-boundary");
    store.setByPath("/items/42", { value: "replaced", label: "item-42" });

    expect(calls[42]).toBe(2);
    expect(calls.reduce((total, count) => total + count, 0)).toBe(2);

    unsubscribeList.forEach((unsubscribe) => unsubscribe());
  });
});

describe("path helpers", () => {
  it("normalizes and reads paths", () => {
    expect(normalizeDataPath("user/name")).toBe("/user/name");
    expect(normalizeDataPath("/user/name")).toBe("/user/name");
    expect(normalizeDataPath("")).toBe("/");
    expect(getByPath({ "a/b": { "~key": 1 } }, "/a~1b/~0key")).toBe(1);
  });

  it("sets root and missing nested paths", () => {
    expect(setByPath({ old: true }, "/", { next: true })).toEqual({ next: true });
    expect(setByPath({}, "/items/0/name", "Ann")).toEqual({ items: [{ name: "Ann" }] });
  });

  it("handles normalized roots, numeric object keys and escaped segments", () => {
    expect(normalizeDataPath("///")).toBe("/");
    expect(normalizeDataPath("/items//0/name")).toBe("/items/0/name");
    expect(setByPath({}, "/2026/value", true)).toEqual({ 2026: { value: true } });
    expect(setByPath({}, "/a~1b/~0key", 1)).toEqual({ "a/b": { "~key": 1 } });
  });
});

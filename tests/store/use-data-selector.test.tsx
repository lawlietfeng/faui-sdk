import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createDataStore, useDataSelector } from "../../src";

describe("useDataSelector", () => {
  it("reads the initial value and responds to subscribed path updates", () => {
    const store = createDataStore({
      user: { name: "Ann" }
    });

    function Probe() {
      const name = useDataSelector<string>(store, "/user/name");

      return <div data-testid="value">{name}</div>;
    }

    render(<Probe />);

    expect(screen.getByTestId("value")).toHaveTextContent("Ann");

    act(() => {
      store.setByPath("/user/name", "Bob");
    });

    expect(screen.getByTestId("value")).toHaveTextContent("Bob");
  });

  it("does not rerender when an unrelated path changes", () => {
    const store = createDataStore({
      user: { name: "Ann" },
      settings: { theme: "light" }
    });
    let renders = 0;

    function Probe() {
      renders += 1;
      const name = useDataSelector<string>(store, "/user/name");

      return <div data-testid="value">{name}</div>;
    }

    render(<Probe />);

    act(() => {
      store.setByPath("/settings/theme", "dark");
    });

    expect(screen.getByTestId("value")).toHaveTextContent("Ann");
    expect(renders).toBe(1);
  });

  it("returns undefined and does not subscribe when path is missing", () => {
    const store = createDataStore({
      user: { name: "Ann" }
    });
    let renders = 0;

    function Probe() {
      renders += 1;
      const value = useDataSelector(store);

      return <div data-testid="value">{String(value)}</div>;
    }

    render(<Probe />);

    act(() => {
      store.setByPath("/user/name", "Bob");
    });

    expect(screen.getByTestId("value")).toHaveTextContent("undefined");
    expect(renders).toBe(1);
  });

  it("keeps object snapshots stable until the subscribed branch changes", () => {
    const store = createDataStore({
      user: { name: "Ann", profile: { age: 18 } },
      settings: { theme: "light" }
    });
    const selectedUsers: Array<unknown> = [];

    function Probe() {
      const user = useDataSelector(store, "/user");
      selectedUsers.push(user);

      return <div data-testid="value">{JSON.stringify(user)}</div>;
    }

    render(<Probe />);

    act(() => {
      store.setByPath("/settings/theme", "dark");
    });

    expect(selectedUsers).toHaveLength(1);

    act(() => {
      store.setByPath("/user/profile/age", 19);
    });

    expect(selectedUsers).toHaveLength(2);
    expect(selectedUsers[1]).not.toBe(selectedUsers[0]);
    expect(screen.getByTestId("value")).toHaveTextContent("\"age\":19");
  });
});

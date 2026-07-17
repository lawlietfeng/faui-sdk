import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionConfig, Component, Content } from "../../src/types/schema";
import { SchemaRenderer } from "../../src/SchemaRenderer";
import { ComponentRegistry } from "../../src/components";

function content(components: Component[], dataModel: Record<string, unknown> = {}): Content {
  return { components, dataModel };
}

function renderSchema(
  components: Component[],
  options: {
    dataModel?: Record<string, unknown>;
    initialData?: Record<string, unknown>;
    onAction?: (action: ActionConfig) => void | Promise<void>;
  } = {},
) {
  return render(
    <SchemaRenderer
      schema={content(components, options.dataModel)}
      componentRegistry={ComponentRegistry}
      initialData={options.initialData}
      onAction={options.onAction}
    />,
  );
}

describe("layout and branching components", () => {
  it("Box maps layout, spacing, padding and alignment while rendering children", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderSchema([
      {
        id: "root",
        component: "box",
        layout: "horizontal",
        spacing: 12,
        padding: "8px",
        align: "start",
        justify: "space-between",
        domId: "layout-root",
        className: "custom",
        children: ["label", "missing"],
      } as Component,
      { id: "label", component: "text", content: "Child" } as Component,
    ]);

    const root = document.getElementById("layout-root");
    expect(root).toHaveClass("faui-box-h", "custom");
    expect(root).toHaveStyle({
      gap: "12px",
      padding: "8px",
      alignItems: "flex-start",
      justifyContent: "space-between",
    });
    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith("Component not found: missing");
  });

  it("Condition renders then, else and default branches", () => {
    const thenRender = renderSchema([
      {
        id: "root",
        component: "condition",
        when: "${$root.allowed}",
        then: ["yes"],
        else: ["no"],
      } as Component,
      { id: "yes", component: "text", content: "Allowed" } as Component,
      { id: "no", component: "text", content: "Denied" } as Component,
    ], { dataModel: { allowed: true } });

    expect(screen.getByText("Allowed")).toBeInTheDocument();
    expect(screen.queryByText("Denied")).not.toBeInTheDocument();
    thenRender.unmount();

    const elseRender = renderSchema([
      {
        id: "root",
        component: "condition",
        when: false,
        then: ["yes"],
        default: ["fallback"],
      } as Component,
      { id: "yes", component: "text", content: "Allowed" } as Component,
      { id: "fallback", component: "text", content: "Fallback" } as Component,
    ]);
    expect(screen.getByText("Fallback")).toBeInTheDocument();
    elseRender.unmount();
  });

  it("Condition supports match cases and case fallback", () => {
    const first = renderSchema([
      {
        id: "root",
        component: "condition",
        match: "${$root.status}",
        cases: { ready: ["ready"] },
        default: ["fallback"],
      } as Component,
      { id: "ready", component: "text", content: "Ready" } as Component,
      { id: "fallback", component: "text", content: "Fallback" } as Component,
    ], { dataModel: { status: "ready" } });
    expect(screen.getByText("Ready")).toBeInTheDocument();
    first.unmount();

    renderSchema([
      {
        id: "root",
        component: "condition",
        match: "missing",
        cases: { ready: ["ready"] },
        default: ["fallback"],
      } as Component,
      { id: "fallback", component: "text", content: "Fallback" } as Component,
    ]);
    expect(screen.getByText("Fallback")).toBeInTheDocument();
  });
});

describe("Repeater", () => {
  it("renders scoped expressions for every item", () => {
    renderSchema([
      {
        id: "root",
        component: "repeater",
        data: { path: "/items" },
        keyField: "id",
        direction: "horizontal",
        gap: 6,
        className: "people",
        style: { padding: 4 },
        children: ["name", "missing"],
      } as Component,
      { id: "name", component: "text", content: "${$current.name}" } as Component,
    ], { dataModel: { items: [{ id: "a", name: "Ann" }, { id: "b", name: "Bob" }] } });

    expect(screen.getByText("Ann")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    const container = screen.getByText("Ann").parentElement;
    expect(container).toHaveClass("faui-repeater-h", "people");
    expect(container).toHaveStyle({ gap: "6px", padding: "4px" });
  });

  it("renders evaluated empty content and otherwise returns null", () => {
    const first = renderSchema([
      {
        id: "root",
        component: "repeater",
        data: { path: "/items" },
        emptyContent: "No ${$root.kind}",
        style: { color: "red" },
      } as Component,
    ], { dataModel: { items: [], kind: "records" } });
    expect(screen.getByText("No records")).toHaveStyle({ color: "red" });
    first.unmount();

    const second = renderSchema([
      { id: "root", component: "repeater", data: { path: "/items" } } as Component,
    ], { dataModel: { items: "invalid" } });
    expect(second.container.querySelector(".faui-repeater")).toBeNull();
  });

  it("resolves relative input bindings inside repeated items", async () => {
    const onAction = vi.fn();
    renderSchema([
      {
        id: "root",
        component: "repeater",
        data: { path: "/items" },
        keyField: "id",
        children: ["name-input"],
      } as Component,
      {
        id: "name-input",
        component: "input",
        value: { path: "./name" },
      } as Component,
    ], {
      dataModel: { items: [{ id: 1, name: "Ann" }, { id: 2, name: "Bob" }] },
      onAction,
    });

    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveValue("Ann");
    fireEvent.change(inputs[0], { target: { value: "Carol" } });

    await waitFor(() => expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/items/0/name", value: "Carol" }),
      expect.objectContaining({ $current: { id: 1, name: "Ann" } }),
    ));
    expect(inputs[0]).toHaveValue("Carol");
  });
});

describe("form component integration", () => {
  it("blocks submit actions until required fields are valid", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderSchema([
      {
        id: "root",
        component: "form",
        submitButtonId: "submit",
        children: ["name", "submit"],
      } as Component,
      {
        id: "name",
        component: "input",
        field: "name",
        value: { path: "/name" },
        rules: [{ required: true, message: "Name required" }],
      } as Component,
      {
        id: "submit",
        component: "button",
        label: "Submit",
        on_tap: { action: "update_data", path: "/submitted", value: true },
      } as Component,
    ], { dataModel: { name: "" }, onAction });

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onAction).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox"), "Ann");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/submitted", value: true }),
      expect.anything(),
    ));
    expect(screen.getByRole("textbox")).toHaveValue("Ann");
  });

  it("Button renders child components when label and content are absent", () => {
    renderSchema([
      { id: "root", component: "button", children: ["label", "missing"] } as Component,
      { id: "label", component: "text", content: "Nested label" } as Component,
    ]);
    expect(screen.getByRole("button", { name: "Nested label" })).toBeInTheDocument();
  });
});

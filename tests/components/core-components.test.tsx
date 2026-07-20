import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionConfig, Component, Content } from "../../src/types/schema";
import { SchemaRenderer, type RendererHandle } from "../../src/SchemaRenderer";
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

  it("keeps the existing internal http_proxy submit behavior", async () => {
    const httpRequest = vi.fn().mockResolvedValue({ ok: true });
    render(
      <SchemaRenderer
        schema={content([
          { id: "root", component: "form", submitButtonId: "submit", children: ["submit"] } as Component,
          {
            id: "submit",
            component: "button",
            label: "Internal submit",
            on_tap: {
              action: "http_proxy",
              payload: { http_config: { method: "POST", path: "/api/internal" }, http_body: { value: 1 } },
            },
          } as Component,
        ])}
        componentRegistry={ComponentRegistry}
        httpRequest={httpRequest}
      />,
    );

    await userEvent.setup().click(screen.getByRole("button", { name: "Internal submit" }));
    await waitFor(() => expect(httpRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: "POST",
      url: "/api/internal",
      body: { value: 1 },
    })));
  });

  it("keeps external submit separate from an internal submit button action", async () => {
    const rendererRef = React.createRef<RendererHandle>();
    const onAction = vi.fn();
    const onSubmit = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <SchemaRenderer
        schema={content([
          { id: "root", component: "form", submitButtonId: "submit", children: ["name", "submit"] } as Component,
          { id: "name", component: "input", field: "name", value: { path: "/name" }, rules: [{ required: true, message: "Name required" }] } as Component,
          { id: "submit", component: "button", label: "Submit", on_tap: { action: "update_data", path: "/submitted", value: true } } as Component,
        ], { name: "" })}
        componentRegistry={ComponentRegistry}
        rendererRef={rendererRef}
        onAction={onAction}
        onSubmit={onSubmit}
      />,
    );

    await act(async () => {
      await expect(rendererRef.current?.submit("root")).resolves.toMatchObject({
        success: false,
        status: "validation_failed",
      });
    });
    expect(onAction).not.toHaveBeenCalled();

    await userEvent.setup().type(screen.getByRole("textbox"), "Ann");
    await act(async () => {
      await expect(rendererRef.current?.submit("root")).resolves.toMatchObject({
        success: true,
        status: "submitted",
      });
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: "/submitted" }),
      expect.anything(),
    );

    await userEvent.setup().click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/submitted" }),
      expect.anything(),
    ));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("configures both onSubmit and submitButtonId"));
  });

  it("validates and submits externally without a schema submit button", async () => {
    const rendererRef = React.createRef<RendererHandle>();
    const onSubmit = vi.fn();
    render(
      <SchemaRenderer
        schema={content([
          { id: "root", component: "form", children: ["name"] } as Component,
          { id: "name", component: "input", field: "name", value: { path: "/name" }, rules: [{ required: true, message: "Name required" }] } as Component,
        ], { name: "", untouched: "kept", nested: { enabled: true } })}
        componentRegistry={ComponentRegistry}
        rendererRef={rendererRef}
        onSubmit={onSubmit}
      />,
    );

    await act(async () => {
      await expect(rendererRef.current?.validate("root")).resolves.toMatchObject({
        valid: false,
        formId: "root",
        errors: { name: "Name required" },
      });
    });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Ann" } });
    expect(screen.getByRole("textbox")).toHaveValue("Ann");
    await act(async () => {
      await expect(rendererRef.current?.validate("root")).resolves.toMatchObject({ valid: true });
    });
    let submitResult: Awaited<ReturnType<RendererHandle["submit"]>> | undefined;
    await act(async () => {
      submitResult = await rendererRef.current?.submit("root");
    });
    expect(onSubmit).toHaveBeenCalledWith(
      { name: "Ann", untouched: "kept", nested: { enabled: true } },
      expect.objectContaining({
        formId: "root",
        validated: true,
        source: "external",
      }),
    );
    expect(submitResult).toMatchObject({
      success: true,
      status: "submitted",
      data: { name: "Ann", untouched: "kept", nested: { enabled: true } },
    });
  });

  it("runs custom validation and supports explicitly skipping validation", async () => {
    const rendererRef = React.createRef<RendererHandle>();
    const onSubmit = vi.fn();
    const onValidate = vi.fn(async (data: Record<string, unknown>) => ({
      valid: data.name !== "blocked",
      formId: "root",
      data,
      errors: (data.name === "blocked" ? { name: "Name is blocked" } : {}) as Record<string, string>,
    }));
    render(
      <SchemaRenderer
        schema={content([
          { id: "root", component: "form", children: ["name"] } as Component,
          { id: "name", component: "input", value: { path: "/name" } } as Component,
        ], { name: "" })}
        componentRegistry={ComponentRegistry}
        rendererRef={rendererRef}
        onValidate={onValidate}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.setup().type(screen.getByRole("textbox"), "blocked");
    await act(async () => {
      await expect(rendererRef.current?.submit("root")).resolves.toMatchObject({
        status: "validation_failed",
        validation: { errors: { name: "Name is blocked" } },
      });
    });
    expect(screen.getByText("Name is blocked")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await act(async () => {
      await expect(rendererRef.current?.submit("root", { validate: false })).resolves.toMatchObject({
        status: "submitted",
      });
    });
    expect(onValidate).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      { name: "blocked" },
      expect.objectContaining({ validated: false, validation: undefined }),
    );
  });

  it("returns complete data after submit failures and supports retry", async () => {
    const rendererRef = React.createRef<RendererHandle>();
    const onSubmit = vi.fn()
      .mockRejectedValueOnce(new Error("Request failed"))
      .mockResolvedValue(undefined);
    render(
      <SchemaRenderer
        schema={content([
          { id: "root", component: "form", children: ["name"] } as Component,
          { id: "name", component: "input", value: { path: "/name" } } as Component,
        ], { name: "" })}
        componentRegistry={ComponentRegistry}
        rendererRef={rendererRef}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.setup().type(screen.getByRole("textbox"), "Ann");
    await act(async () => {
      await expect(rendererRef.current?.submit("root")).resolves.toMatchObject({
        status: "error",
        data: { name: "Ann" },
      });
      await expect(rendererRef.current?.submit("root")).resolves.toMatchObject({
        status: "submitted",
        data: { name: "Ann" },
      });
    });
  });

  it("blocks concurrent submissions for the same form", async () => {
    const rendererRef = React.createRef<RendererHandle>();
    let release: (() => void) | undefined;
    const onSubmit = vi.fn(() => new Promise<void>(resolve => {
      release = resolve;
    }));
    render(
      <SchemaRenderer
        schema={content([{ id: "root", component: "form" } as Component], { value: 1 })}
        componentRegistry={ComponentRegistry}
        rendererRef={rendererRef}
        onSubmit={onSubmit}
      />,
    );

    const first = rendererRef.current!.submit("root");
    await expect(rendererRef.current!.submit("root")).resolves.toMatchObject({ status: "busy" });
    await waitFor(() => expect(release).toBeTypeOf("function"));
    release!();
    await expect(first).resolves.toMatchObject({ status: "submitted" });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("requires a form id for multiple forms and reports missing forms", async () => {
    const rendererRef = React.createRef<RendererHandle>();
    render(
      <SchemaRenderer
        schema={content([
          { id: "root", component: "box", children: ["form-a", "form-b"] } as Component,
          { id: "form-a", component: "form" } as Component,
          { id: "form-b", component: "form" } as Component,
        ])}
        componentRegistry={ComponentRegistry}
        rendererRef={rendererRef}
      />,
    );

    await expect(rendererRef.current!.validate()).resolves.toMatchObject({
      valid: false,
      errors: { $form: expect.stringContaining("formId is required") },
    });
    await expect(rendererRef.current!.submit("missing")).resolves.toMatchObject({
      success: false,
      status: "error",
      formId: "missing",
    });
  });

  it("Button renders child components when label and content are absent", () => {
    renderSchema([
      { id: "root", component: "button", children: ["label", "missing"] } as Component,
      { id: "label", component: "text", content: "Nested label" } as Component,
    ]);
    expect(screen.getByRole("button", { name: "Nested label" })).toBeInTheDocument();
  });
});

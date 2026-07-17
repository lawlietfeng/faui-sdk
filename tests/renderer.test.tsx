import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Activity, Component, Content } from "../src/types/schema";
import { Renderer } from "../src/Renderer";
import { ComponentRenderer, SchemaRenderer } from "../src/SchemaRenderer";
import { RendererContextProvider } from "../src/context/RendererContext";

const Probe: React.FC<{ config: Component }> = ({ config }) => (
  <div data-testid={config.id}>{config.content ?? config.id}</div>
);

function schema(components: Component[], dataModel: Record<string, unknown> = {}): Content {
  return { components, dataModel };
}

describe("Renderer", () => {
  it("renders an activity snapshot through the component registry", () => {
    const activities: Activity[] = [{
      type: "ACTIVITY_SNAPSHOT",
      content: schema([{ id: "root", component: "probe", content: "ready" } as Component]),
    }];

    render(<Renderer schema={activities} componentRegistry={{ probe: Probe }} />);

    expect(screen.getByTestId("root")).toHaveTextContent("ready");
  });

  it("renders a clear activity processing error", () => {
    render(<Renderer schema={[]} componentRegistry={{ probe: Probe }} />);

    expect(screen.getByText(/Invalid schema:/)).toHaveTextContent("ACTIVITY_SNAPSHOT");
  });
});

describe("SchemaRenderer", () => {
  it("rejects schemas missing required top-level fields", () => {
    const { rerender } = render(
      <SchemaRenderer schema={null as unknown as Content} componentRegistry={{}} />,
    );
    expect(screen.getByText("Invalid UI schema: missing components or dataModel")).toBeInTheDocument();

    rerender(
      <SchemaRenderer schema={{ components: [] } as unknown as Content} componentRegistry={{}} />,
    );
    expect(screen.getByText("Invalid UI schema: missing components or dataModel")).toBeInTheDocument();
  });

  it("reports a missing root component", () => {
    render(<SchemaRenderer schema={schema([])} componentRegistry={{}} />);
    expect(screen.getByText("No root component found")).toBeInTheDocument();
  });

  it("lets custom components override the base registry", () => {
    const Base = () => <div>base</div>;
    const Custom = () => <div>custom</div>;
    render(
      <SchemaRenderer
        schema={schema([{ id: "root", component: "probe" } as Component])}
        componentRegistry={{ probe: Base }}
        customComponents={{ probe: Custom }}
      />,
    );

    expect(screen.getByText("custom")).toBeInTheDocument();
    expect(screen.queryByText("base")).not.toBeInTheDocument();
  });

  it("uses the base registry when no custom registry is supplied", () => {
    render(
      <SchemaRenderer
        schema={schema([{ id: "root", component: "probe" } as Component])}
        componentRegistry={{ probe: Probe }}
      />,
    );
    expect(screen.getByTestId("root")).toBeInTheDocument();
  });
});

describe("ComponentRenderer", () => {
  function renderComponent(
    component: Component,
    registry: Record<string, React.FC<any>> = { probe: Probe },
  ) {
    return render(
      <RendererContextProvider dataModel={{ visible: true }} componentRegistry={registry}>
        <ComponentRenderer component={component} componentMap={new Map([[component.id, component]])} />
      </RendererContextProvider>,
    );
  }

  it("does not render a component with false visibility", () => {
    renderComponent({ id: "hidden", component: "probe", visible: false } as Component);
    expect(screen.queryByTestId("hidden")).not.toBeInTheDocument();
  });

  it("evaluates visibility expressions", () => {
    renderComponent({
      id: "conditional",
      component: "probe",
      visible: "${$root.visible}",
    } as Component);
    expect(screen.getByTestId("conditional")).toBeInTheDocument();
  });

  it("warns and returns null for unknown component types", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderComponent({ id: "unknown", component: "missing" } as Component);

    expect(warn).toHaveBeenCalledWith("Unknown component type: missing");
    expect(screen.queryByTestId("unknown")).not.toBeInTheDocument();
  });

  it("executes one or more on_mount actions in order", async () => {
    const onAction = vi.fn();
    const component = {
      id: "mounted",
      component: "probe",
      on_mount: [
        { action: "update_data", path: "/first", value: 1 },
        { action: "update_data", path: "/second", value: 2 },
      ],
    } as Component;

    render(
      <RendererContextProvider dataModel={{}} componentRegistry={{ probe: Probe }} onAction={onAction}>
        <ComponentRenderer component={component} componentMap={new Map([[component.id, component]])} />
      </RendererContextProvider>,
    );

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(2));
    expect(onAction.mock.calls.map(([action]) => action.path)).toEqual(["/first", "/second"]);
  });

  it("logs rejected on_mount actions", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onAction = vi.fn().mockRejectedValue(new Error("mount failed"));
    const component = {
      id: "mounted",
      component: "probe",
      on_mount: { action: "update_data", path: "/ready", value: true },
    } as Component;

    render(
      <RendererContextProvider dataModel={{}} componentRegistry={{ probe: Probe }} onAction={onAction}>
        <ComponentRenderer component={component} componentMap={new Map([[component.id, component]])} />
      </RendererContextProvider>,
    );

    await waitFor(() => {
      expect(error).toHaveBeenCalledWith(
        '[FAUI] on_mount error in "mounted":',
        expect.objectContaining({ message: "mount failed" }),
      );
    });
  });

  it("contains component crashes with the error boundary", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const Crashing = () => {
      throw new Error("render failed");
    };
    renderComponent(
      { id: "broken", component: "crashing" } as Component,
      { probe: Probe, crashing: Crashing },
    );

    expect(screen.getByText("Component error: broken (crashing)")).toBeInTheDocument();
    expect(error).toHaveBeenCalled();
  });
});

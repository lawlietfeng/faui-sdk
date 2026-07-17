import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Activity, Component } from "../src/types/schema";
import * as packageEntry from "../src/index";
import * as formEntry from "../src/index.tsx";
import * as fullEntry from "../src/full";
import { FormComponentRegistry } from "../src/components/formRegistry";
import { ComponentRegistry as FullComponentRegistry } from "../src/components";

function snapshot(component = "text"): Activity[] {
  return [{
    type: "ACTIVITY_SNAPSHOT",
    content: {
      dataModel: {},
      components: [{ id: "root", component, content: "Entry ready" } as Component],
    },
  }];
}

describe("package entry points", () => {
  it("uses the form renderer and registry at the default package entry", () => {
    expect(packageEntry.Renderer).toBe(formEntry.Renderer);
    expect(packageEntry.ComponentRegistry).toBe(FormComponentRegistry);
    expect(packageEntry.ComponentRegistry).not.toBe(FullComponentRegistry);
  });

  it("exports the full renderer with the full component registry", () => {
    expect(fullEntry.ComponentRegistry).toBe(FullComponentRegistry);
    expect(fullEntry.ComponentRegistry.chart).toBeDefined();
    expect(formEntry.ComponentRegistry.chart).toBeUndefined();
  });

  it("renders with the default form-edition registry", () => {
    render(<formEntry.Renderer schema={snapshot()} />);
    expect(screen.getByText("Entry ready")).toBeInTheDocument();
  });

  it("renders with the default full-edition registry", () => {
    render(<fullEntry.Renderer schema={snapshot()} />);
    expect(screen.getByText("Entry ready")).toBeInTheDocument();
  });

  it.each([
    ["form", formEntry.Renderer],
    ["full", fullEntry.Renderer],
  ] as const)("allows the %s renderer registry to be overridden", (_name, EntryRenderer) => {
    const Custom = () => <div>Custom entry</div>;
    render(<EntryRenderer schema={snapshot("custom")} componentRegistry={{ custom: Custom }} />);
    expect(screen.getByText("Custom entry")).toBeInTheDocument();
  });

  it("exposes the documented shared runtime API", () => {
    expect(packageEntry).toMatchObject({
      SchemaRenderer: expect.any(Function),
      ComponentRenderer: expect.any(Function),
      CoreRenderer: expect.any(Function),
      RendererContextProvider: expect.any(Function),
      useRendererContext: expect.any(Function),
      useDataModel: expect.any(Function),
      useExpression: expect.any(Function),
      useAction: expect.any(Function),
      useRendererDataSelector: expect.any(Function),
      applyActivityDeltas: expect.any(Function),
      useActivityContent: expect.any(Function),
      createDataStore: expect.any(Function),
      evaluateExpression: expect.any(Function),
      evaluateObject: expect.any(Function),
      executeAction: expect.any(Function),
      updateDataAction: expect.any(Function),
      httpProxyAction: expect.any(Function),
      messageAction: expect.any(Function),
      notificationAction: expect.any(Function),
      registerComponent: expect.any(Function),
      createExtendedRegistry: expect.any(Function),
    });
  });
});

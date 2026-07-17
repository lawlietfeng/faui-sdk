import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Component } from "../../src/types/schema";
import {
  ComponentRegistry,
  createExtendedRegistry,
  registerComponent,
} from "../../src/components";
import { FormComponentRegistry } from "../../src/components/formRegistry";
import { RendererContextProvider } from "../../src/context/RendererContext";

const fullRegistryKeys = [
  "form", "flex", "grid", "row", "col", "space", "layout", "header", "sider",
  "content", "footer", "avatar", "badge", "empty", "statistic", "timeline", "qrcode",
  "typography", "icon", "watermark", "skeleton", "box", "text", "button", "input",
  "textarea", "select", "radio", "checkbox", "datepicker", "upload", "stepindicator",
  "list", "table", "switch", "inputnumber", "slider", "rate", "cascader", "treeselect",
  "timepicker", "colorpicker", "transfer", "autocomplete", "mentions", "card", "divider",
  "collapse", "tag", "image", "descriptions", "alert", "pagination", "progress", "spin",
  "tabs", "menu", "segmented", "tree", "calendar", "steps", "carousel", "tour", "modal",
  "drawer", "popover", "tooltip", "popconfirm", "dropdown", "float_button", "affix", "anchor",
  "condition", "repeater", "chart",
] as const;

const formRegistryKeys = [
  "box", "flex", "grid", "row", "col", "space", "layout", "header", "sider", "content",
  "footer", "divider", "form", "input", "textarea", "select", "radio", "checkbox",
  "datepicker", "timepicker", "upload", "switch", "inputnumber", "slider", "rate", "cascader",
  "treeselect", "colorpicker", "transfer", "autocomplete", "mentions", "button", "calendar",
  "segmented", "text", "icon", "typography", "alert", "tag", "spin", "skeleton", "progress",
  "modal", "drawer", "tooltip", "popover", "popconfirm", "condition", "repeater",
] as const;

function minimalConfig(component: string): Component {
  const base: Record<string, unknown> = {
    id: `test-${component}`,
    component,
    content: "content",
    label: "label",
    title: "title",
    value: undefined,
    children: [],
    items: [],
    options: [],
    dataSource: [],
    columns: [],
    steps: [],
    data: undefined,
    when: false,
    open: false,
    visible: true,
  };

  if (component === "qrcode") base.value = "https://example.com";
  if (component === "progress") base.percent = 0;
  if (component === "image") base.src = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
  if (component === "chart") base.height = 100;
  if (component === "statistic") base.value = 0;

  return base as unknown as Component;
}

describe("component registries", () => {
  it("contains every full-edition component", () => {
    expect(Object.keys(ComponentRegistry).sort()).toEqual([...fullRegistryKeys].sort());
  });

  it("contains the intended form-edition subset", () => {
    expect(Object.keys(FormComponentRegistry).sort()).toEqual([...formRegistryKeys].sort());
  });

  it("creates an extended registry without mutating the base registry", () => {
    const Custom = () => <div>custom</div>;
    const previous = ComponentRegistry.text;
    const extended = createExtendedRegistry({ text: Custom, custom: Custom });

    expect(extended.text).toBe(Custom);
    expect(extended.custom).toBe(Custom);
    expect(ComponentRegistry.text).toBe(previous);
  });

  it("registers a component in the shared registry", () => {
    const Custom = () => <div>custom</div>;
    const previous = ComponentRegistry.text;

    registerComponent("text", Custom);
    expect(ComponentRegistry.text).toBe(Custom);

    registerComponent("text", previous);
  });
});

describe("component smoke contracts", () => {
  it.each(fullRegistryKeys)("renders a minimal %s component without crashing", (componentName) => {
    const config = minimalConfig(componentName);
    const ComponentType = ComponentRegistry[componentName];
    const componentMap = new Map([[config.id, config]]);

    expect(() => render(
      <RendererContextProvider dataModel={{}} componentRegistry={ComponentRegistry}>
        <ComponentType config={config} componentMap={componentMap} />
      </RendererContextProvider>,
    )).not.toThrow();
  });
});

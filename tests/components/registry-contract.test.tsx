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
import {
  componentManifest,
  formComponentNames,
  fullComponentNames,
} from "../../src/manifest";

const fullRegistryKeys = fullComponentNames;
const formRegistryKeys = formComponentNames;

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
  it("publishes a versioned static manifest for documentation consumers", () => {
    expect(componentManifest.manifestVersion).toBe(1);
    expect(componentManifest.framework).toBe("react");
    expect(componentManifest.editions.form.componentNames).toEqual(formComponentNames);
    expect(componentManifest.editions.full.componentNames).toEqual(fullComponentNames);
    expect(new Set(fullComponentNames).size).toBe(fullComponentNames.length);
    for (const component of componentManifest.components) {
      const categoryExists = componentManifest.categories.some(({ id }) => id === component.category);
      const availableComponentNames = component.availability === "form-full"
        ? formComponentNames
        : fullComponentNames;
      const registryNamesAreAvailable = component.registryNames.every((name) => availableComponentNames.includes(name));
      expect(Boolean(component.slug && component.title && component.summary)).toBe(true);
      expect(component.registryNames.length).toBeGreaterThan(0);
      expect(categoryExists).toBe(true);
      expect(registryNamesAreAvailable).toBe(true);
    }
    expect(JSON.parse(JSON.stringify(componentManifest))).toEqual(componentManifest);
  });

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

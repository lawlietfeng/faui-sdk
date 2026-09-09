import { describe, expect, it } from "vitest";
import { createRendererBootstrap, fauiSdkInfo } from "../src";
import packageJson from "../package.json";

describe("fauiSdkInfo", () => {
  it("exposes package name and version", () => {
    expect(fauiSdkInfo).toEqual({
      name: "@faui/react",
      version: packageJson.version
    });
  });
});

describe("createRendererBootstrap", () => {
  it("uses form mode by default", () => {
    expect(createRendererBootstrap()).toEqual({ mode: "form" });
  });

  it("keeps an explicit full mode", () => {
    expect(createRendererBootstrap({ mode: "full" })).toEqual({ mode: "full" });
  });
});

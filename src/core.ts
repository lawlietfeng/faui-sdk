export interface FauiSdkInfo {
  name: string;
  version: string;
}

export interface RendererBootstrapOptions {
  mode?: "form" | "full";
}

export const fauiSdkInfo: FauiSdkInfo = {
  name: "@lawlietfeng/faui-sdk",
  version: "0.0.0"
};

export function createRendererBootstrap(options: RendererBootstrapOptions = {}): Required<RendererBootstrapOptions> {
  return {
    mode: options.mode ?? "form"
  };
}

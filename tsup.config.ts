import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts"
  },
  format: ["cjs", "esm"],
  dts: true,
  treeshake: true,
  splitting: true,
  external: ["react", "react-dom", "antd", "dayjs"],
  noExternal: ["fast-json-patch"],
  tsconfig: "tsconfig.build.json",
  clean: true
});

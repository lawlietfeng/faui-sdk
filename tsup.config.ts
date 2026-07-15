import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.tsx',
    full: 'src/full.tsx',
  },
  format: ['cjs', 'esm'],
  dts: true,
  treeshake: true,
  splitting: true,
  external: ['react', 'react-dom', 'antd', 'dayjs', '@ant-design/icons', /^echarts/, 'framer-motion'],
  noExternal: ['fast-json-patch'],
  tsconfig: 'tsconfig.build.json',
  clean: true,
});

import { createRendererBootstrap, fauiSdkInfo } from "../src";

export default function App() {
  const bootstrap = createRendererBootstrap();

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>FAUI SDK</h1>
      <p>{fauiSdkInfo.name}</p>
      <p>Version: {fauiSdkInfo.version}</p>
      <p>Mode: {bootstrap.mode}</p>
    </main>
  );
}

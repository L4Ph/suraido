import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: { entry: ["src/cli.ts", "src/serve.ts"], dts: true, format: ["esm"] },
  // All of this is a server. Nothing here wants a DOM.
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});

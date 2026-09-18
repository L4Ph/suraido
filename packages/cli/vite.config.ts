import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: { entry: ["src/cli.ts"], dts: true, format: ["esm"] },
  // All of this drives a browser and writes files. Nothing here wants a DOM.
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});

import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: { entry: ["src/cli.ts"], dts: true, format: ["esm"] },
  // All of this drives a browser and writes files. Nothing here wants a DOM.
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});

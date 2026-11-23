import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    // One entry per published export subpath.
    entry: ["src/index.ts", "src/jsx-runtime.ts", "src/jsx-dev-runtime.ts"],
    dts: true,
    format: ["esm"],
    // The CSS is not imported from JS — the library does not force it on anyone — so no
    // entry reaches it. Ship it as-is.
    copy: [
      { from: "src/deck.css", to: "dist" },
      { from: "src/themes/*.css", to: "dist/themes" },
    ],
  },

  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    include: ["src/**/*.test.ts"],
    environment: "happy-dom",
  },
});

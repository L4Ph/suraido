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
    include: ["src/**/*.test.ts"],
    environment: "happy-dom",
  },
});

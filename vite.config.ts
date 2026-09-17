import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    overrides: [
      {
        // These are published, or copied by people who are not using Vite+.
        // They must import from vite itself.
        files: ["packages/create-todan/template/**", "examples/**"],
        rules: { "vite-plus/prefer-vite-plus-imports": "off" },
      },
    ],
    options: { typeAware: true, typeCheck: true },
  },
});

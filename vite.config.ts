import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  // Every package brings its own environment, so `vp test` here has to run them as projects
  // rather than as one flat pile of files — otherwise nothing gets a DOM.
  test: { projects: ["packages/*"] },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    overrides: [
      {
        // These are published, or copied by people who are not using Vite+.
        // They must import from vite itself.
        files: ["packages/create-suraido/template/**", "examples/**"],
        rules: { "vite-plus/prefer-vite-plus-imports": "off" },
      },
    ],
    options: { typeAware: true, typeCheck: true },
  },
});

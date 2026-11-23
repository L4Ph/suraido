import { defineConfig } from "vite-plus";

// There is no JSX configuration here. Vite reads jsxImportSource from tsconfig.json.
export default defineConfig({
  server: { port: Number(process.env.PORT) || 5173 },
});

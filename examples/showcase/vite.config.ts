import { defineConfig } from "vite";

// Deployed under /suraido/ on GitHub Pages; served from / in development.
export default defineConfig({
  base: process.env.PAGES_BASE ?? "/",
  server: { port: Number(process.env.PORT) || 5173 },
});

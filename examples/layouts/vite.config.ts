import { defineConfig } from 'vite'

// JSX の設定はここには無い。tsconfig.json の jsxImportSource を Vite がそのまま読む。
export default defineConfig({
  server: { port: Number(process.env.PORT) || 5173 },
})

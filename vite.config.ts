import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  build: {
    target: ['es2018', 'safari13'],
    cssTarget: 'safari13',
  },
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://127.0.0.1:3456', changeOrigin: true } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

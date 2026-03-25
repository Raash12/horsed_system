import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import { fileURLToPath } from "url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      "/api": {
        // Use IPv4 to avoid ::1 connection issues on Windows
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

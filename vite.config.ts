import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: "/",
  server: {
    port: 3000,
    open: true,
    strictPort: true, // needed
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
    }
  },
  plugins: [vue()],
  resolve:{
    alias:{
      "~": path.resolve(__dirname, "./"),
      "@": path.resolve(__dirname, "src"),
    }
  }
})

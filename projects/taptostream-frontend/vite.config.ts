import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // Ensure we always resolve the shim from THIS project, not a parent node_modules.
      'vite-plugin-node-polyfills/shims/global': path.resolve(
        __dirname,
        'node_modules/vite-plugin-node-polyfills/shims/global'
      ),
      'vite-plugin-node-polyfills/shims/buffer': path.resolve(
        __dirname,
        'node_modules/vite-plugin-node-polyfills/shims/buffer'
      ),
      'vite-plugin-node-polyfills/shims/process': path.resolve(
        __dirname,
        'node_modules/vite-plugin-node-polyfills/shims/process'
      ),
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})

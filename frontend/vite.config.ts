import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Split large, rarely-changing vendor libraries into their own long-cached chunks so
    // the browser doesn't re-download them on every app deploy, and so no single JS file
    // blows past the 500 kB warning. Page code is already split via React.lazy routes.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) return 'react-vendor';
          if (id.includes('@tanstack')) return 'query-vendor';
          if (id.includes('framer-motion')) return 'motion-vendor';
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/')) return 'form-vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    // Allow the app to be served through an ngrok tunnel (Vite blocks unknown
    // Host headers by default). Localhost is always permitted regardless.
    allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app", ".ngrok.io"],
    // Same-origin API: the browser calls `/api/*` on whatever host serves the
    // app (localhost or the ngrok URL) and Vite forwards it to the backend.
    // This is what lets a single public URL run the whole app, with no CORS.
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

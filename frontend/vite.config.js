import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The site is served from a domain root on Cloudflare Pages.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
})

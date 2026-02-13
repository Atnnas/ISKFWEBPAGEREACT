import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  // Set base to repo name only when deploying to GitHub Pages
  base: process.env.GITHUB_PAGES ? '/ISKFWEBPAGEREACT/' : '/',
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: undefined
      },
    },
  },
  assetsInclude: ['**/*.mp3']
}))

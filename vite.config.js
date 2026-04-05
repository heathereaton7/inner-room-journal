import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Skip gzip size calculation (speeds up build)
    reportCompressedSize: false,
    // Increase chunk warning threshold (single-page app is expected to be large)
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split Firebase into its own chunk (loaded async, cached separately)
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
        },
      },
    },
  },
})

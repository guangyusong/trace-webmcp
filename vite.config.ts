import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['c3d-standard-16-8core-64ram.taila8a1a.ts.net'],
  },
})

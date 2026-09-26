import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  // Same origin in dev as in production (where frontend/vercel.json rewrites /api), so the session cookie just works
  server: {
    proxy: { '/api': 'http://localhost:4000' },
  },
  build: {
    rollupOptions: {
      external: (id) => id.includes('/reference/'),
    },
  },
})

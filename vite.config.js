import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// No proxy on purpose: the viewer talks to the target app cross-origin, which
// the 0004 contract requires conforming apps to allow in dev (CORS).
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})

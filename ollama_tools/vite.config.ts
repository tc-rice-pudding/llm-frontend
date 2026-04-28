import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true,
    port: 4399,
    proxy: {
      '/api': {
        target: 'http://localhost:3300',
        secure: false,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [vue()],
})

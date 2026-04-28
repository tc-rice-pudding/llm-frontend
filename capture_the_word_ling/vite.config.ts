import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true,
    proxy: {
      '/tts': {
        target: 'https://openspeech.bytedance.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/tts/, ''),
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      }
    },
  },
  plugins: [vue()],
})

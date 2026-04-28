import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true,
    port: 4399,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        secure: false,
        rewrite: path => path.replace(/^\/api/, ''),
      },
      '/klingai': {
        target: 'https://api.klingai.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/klingai/, ''),
      }
    },
  },
  plugins: [
    vue(),
  ],
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backendpos.doubleredcars.sk',
        changeOrigin: true,
        secure: true, // Because it's HTTPS
        // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if needed
      }
    }
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api requests to your backend server
      '/api': {
        target: 'http://localhost:3001', // Your backend's address
        changeOrigin: true, // Recommended for most cases, changes the 'Host' header to the target URL
        // secure: false, // Uncomment if your backend is HTTP and Vite dev server is HTTPS (not typical for local dev)
        // rewrite: (path) => path.replace(/^\/api/, '') // Use if your backend API paths don't start with /api
      }
    }
  },
  // If your index.html is not in the root, or your assets are structured differently,
  // you might need to configure options like `root` or `publicDir`.
  // For the current structure (index.html at root), defaults should work.
});
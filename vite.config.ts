import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This configuration is optimized for GitHub Pages subfolders
export default defineConfig({
  base: '/stock-scanner/', 
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 3000,
  }
});

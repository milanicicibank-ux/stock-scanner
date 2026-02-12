import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // This ensures all files (JS, CSS) are loaded relative to the current folder
  base: './', 
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
});

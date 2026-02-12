import { defineConfig } from 'vite';

export default defineConfig({
  // Use './' to ensure all generated links in index.html are relative
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
});
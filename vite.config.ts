import { defineConfig } from 'vite';

export default defineConfig({
  // Base must be './' for GitHub Pages to resolve assets correctly in subfolders
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
});

import { defineConfig } from 'vite';

export default defineConfig({
  // This is the most important line for GitHub Pages
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
});

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

// Netlify Drop build: a normal multi-file site in ./netlify-dist
export default defineConfig({
  base: './',
  publicDir: 'netlify-public',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  build: { outDir: 'netlify-dist', emptyOutDir: true, assetsInlineLimit: 8192, chunkSizeWarningLimit: 5000 },
});

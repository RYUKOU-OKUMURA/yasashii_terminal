import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'app/renderer'),
  publicDir: resolve(__dirname, 'app/renderer/public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'app/renderer/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      strict: false,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'app/renderer'),
      '@shared': resolve(__dirname, 'app/shared'),
    },
  },
  optimizeDeps: {
    exclude: ['@monaco-editor/react', 'monaco-editor'],
    include: [],
  },
});

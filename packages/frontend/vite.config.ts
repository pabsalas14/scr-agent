/**
 * Configuración de Vite para el frontend React
 * Soporta:
 * - Hot Module Replacement (HMR)
 * - TypeScript
 * - Path aliases
 * - CSS/SCSS
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
    },
  },
  server: {
    port: parseInt(process.env.PORT || '5173'),
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT || '3000'}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/socket.io': {
        target: `http://localhost:${process.env.BACKEND_PORT || '3000'}`,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production to reduce bundle
    minify: 'esbuild', // Use esbuild for faster minification
    // Optimizar tamaño de bundle con mejor code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'motion-vendor': ['framer-motion'],
          'd3-vendor': ['d3'],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // CSS optimization
    cssMinify: true,
    // Optimize images and assets
    assetsDir: 'assets',
    assetsInlineLimit: 4096, // 4kb threshold for inline assets
  },
});

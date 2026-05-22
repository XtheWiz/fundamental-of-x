import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build into dist/ (standard). A post-build copy step moves the artifacts
// to the repo root so GitHub Pages can serve them from main without any
// settings change. The existing static files (topics/, css/, js/, i18n/,
// CNAME, favicons) live at root untouched and are served as-is.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
});

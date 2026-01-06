import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      // Watch .md files and trigger full page reload
      ignored: ['!**/presentation.md'],
    },
  },
  base: './',
  build: {
    // Increase chunk size warning limit for reveal.js and mermaid
    chunkSizeWarningLimit: 2000,
    outDir: 'dist',
  },
  // Force full page reload for .md files
  plugins: [
    {
      name: 'reload-on-md-change',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.md')) {
          server.ws.send({
            type: 'full-reload',
            path: '*',
          });
        }
      },
    },
  ],
});

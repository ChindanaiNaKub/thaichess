import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function deferStylesheets() {
  return {
    name: 'defer-stylesheets',
    apply: 'build' as const,
    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string) {
        return html.replace(/<link rel="stylesheet"([^>]*?)href="([^"]+)"([^>]*)>/g, (_match, beforeHref, href, afterHref) => {
          const attrs = `${beforeHref}${afterHref}`.trim();
          const serializedAttrs = attrs ? ` ${attrs}` : '';

          return [
            `<link rel="preload" as="style" href="${href}"${serializedAttrs}>`,
            `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"${serializedAttrs}>`,
            `<noscript><link rel="stylesheet" href="${href}"${serializedAttrs}></noscript>`,
          ].join('');
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), deferStylesheets()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
});

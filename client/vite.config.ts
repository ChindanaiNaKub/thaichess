import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ command }) => {
  // The repo-root .env (shared with the server) sets NODE_ENV=development for
  // local server runs. Vite's envDir points there too, and its env loading
  // re-applies NODE_ENV after config resolution, so pin the production
  // semantics explicitly for builds: without this, React ships its dev
  // runtime (jsxDEV) and import.meta.env.DEV stays true, which keeps
  // dev-only branches like react-query-devtools in every production bundle.
  const isBuild = command === 'build';

  return {
    ...(isBuild
      ? {
          define: {
            'import.meta.env.DEV': 'false',
            'import.meta.env.PROD': 'true',
            'import.meta.env.MODE': JSON.stringify('production'),
          },
          esbuild: {
            jsxDev: false,
          },
        }
      : {}),

    // Monorepo: shared `.env` / `.env.example` live at the repo root (not client/).
    envDir: path.resolve(__dirname, '..'),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    worker: {
      format: 'es',
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      proxy: {
        '/api': 'http://localhost:3000',
        '/socket.io': {
          target: 'http://localhost:3000',
          ws: true,
        },
      },
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  };
});

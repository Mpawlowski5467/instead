import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), '');

/** @type {import('astro').AstroIntegration} */
const searchIndexIntegration = {
  name: 'instead-search-index',
  hooks: {
    'astro:config:setup': async ({ config, logger }) => {
      const { buildSearchIndex } = await import('./src/lib/build-search-index.ts');
      const count = await buildSearchIndex(config.root);
      logger.info(`search index: ${count} entries written to public/search-index.json`);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: PUBLIC_SITE_URL || 'https://instead.example',
  integrations: [react(), searchIndexIntegration],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});

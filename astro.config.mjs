import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  site: PUBLIC_SITE_URL || 'https://instead.example',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});

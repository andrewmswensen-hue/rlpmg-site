// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { redirects } from './src/data/redirects.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://rlpmg.com',
  // Match the existing WordPress URL shape exactly: every page is /path/ with a trailing slash.
  trailingSlash: 'always',
  build: { format: 'directory' },
  output: 'static',
  compressHTML: true,
  redirects,
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/internal/'),
      serialize(item) {
        // Drop the generic changefreq/priority noise; lastmod is set per page via the build manifest
        // (see src/lib/lastmod.ts, wired in Phase 2).
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

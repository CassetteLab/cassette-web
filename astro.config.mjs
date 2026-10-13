// @ts-check
import { defineConfig } from 'astro/config';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

const NOW_PLAYING_ORIGIN = process.env.NOW_PLAYING_ORIGIN ?? 'https://mathieu-dubart.fr';

// https://astro.build/config
export default defineConfig({
  site: 'https://getcassette.app',
    integrations: [
    sitemap({
      changefreq: ChangeFreqEnum.WEEKLY,
      lastmod: new Date(),
      serialize(item) {
        if (item.url === 'https://getcassette.app/') {
          item.priority = 1.0;
          item.changefreq = ChangeFreqEnum.WEEKLY;
        } else {
          item.priority = 0.6;
          item.changefreq = ChangeFreqEnum.MONTHLY;
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      // Dev only: forward the now-playing calls to the portfolio's Navidrome
      // proxy, so the live pill works locally without any CORS setup.
      proxy: {
        '/api/now-playing': { target: NOW_PLAYING_ORIGIN, changeOrigin: true },
        '/api/cover-art': { target: NOW_PLAYING_ORIGIN, changeOrigin: true },
      },
    },
  },
});

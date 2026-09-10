import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://portfolio-sharn.pages.dev',
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: { prefixDefaultLocale: false },
  },
});

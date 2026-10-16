import { defineConfig } from 'astro/config';
import variantesImages from './src/lib/variantes-images.js';

export default defineConfig({
  site: 'https://portfolio-sharn.pages.dev',
  // Les pages sont des dossiers (/projets/creed/) : les liens finissent par « / » pour éviter une redirection.
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  integrations: [variantesImages()],
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: { prefixDefaultLocale: false },
  },
});

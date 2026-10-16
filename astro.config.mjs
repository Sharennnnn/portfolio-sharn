import { defineConfig } from 'astro/config';
import variantesImages from './src/lib/variantes-images.js';

export default defineConfig({
  site: 'https://portfolio-sharn.pages.dev',
  // Les pages sont des dossiers (/projets/creed/) : les liens finissent par « / » pour éviter une redirection.
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  // CSP en <meta> : Astro y met l'empreinte de chaque script et style qu'il génère.
  // frame-ancestors est dans public/_headers (ignoré par les navigateurs dans une <meta>).
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-src https://www.youtube-nocookie.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // Attributs style="…" (couleur d'accent, noms de transition) : pas de script possible.
      // Empreinte du script is:inline de Base.astro (classe « js ») : Astro ne le hache pas lui-même.
      // shortcut: si ce script change, recalculer l'empreinte (le test de build échoue sinon).
      scriptDirective: { hashes: ['sha256-Du+OJKJSbdUgz5nrHeWWINvez6XKDDU/tyj/5c2uvwo='] },
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }] },
    },
  },
  integrations: [variantesImages()],
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: { prefixDefaultLocale: false },
  },
});

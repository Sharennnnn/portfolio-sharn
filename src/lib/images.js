// Images servies depuis public/ : dimensions réelles lues au build, et chemins des variantes
// que l'intégration « variantes-images » (astro.config.mjs) génère dans dist/ après le build.
import sharp from 'sharp';
import path from 'node:path';

export const LARGEUR_VIGNETTE = 640;
export const LARGEUR_PARTAGE = 1200;

const cache = new Map();

export async function dimensions(src) {
  if (!cache.has(src)) {
    const { width, height } = await sharp(path.join('public', src)).metadata();
    cache.set(src, { width, height });
  }
  return cache.get(src);
}

const nom = (src) => path.basename(src, path.extname(src));
export const urlVignette = (src) => `/images/vignettes/${nom(src)}-${LARGEUR_VIGNETTE}.webp`;
export const urlPartage = (src) => `/images/partage/${nom(src)}.jpg`;

// srcset « vignette + original » ; en dev les variantes n'existent pas encore, on sert l'original seul.
export async function srcsetVignette(src) {
  const { width } = await dimensions(src);
  if (import.meta.env.DEV || width <= LARGEUR_VIGNETTE) return undefined;
  return `${urlVignette(src)} ${LARGEUR_VIGNETTE}w, ${src} ${width}w`;
}

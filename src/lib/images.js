// Images servies depuis public/ : dimensions réelles lues au build, et chemins des variantes
// que l'intégration « variantes-images » (astro.config.mjs) génère dans dist/ après le build.
import sharp from 'sharp';
import path from 'node:path';

export const LARGEUR_VIGNETTE = 640;
// Variante intermédiaire : affiche d'une page projet sur mobile haute densité (372 px × 3) ou desktop 2× (600 px × 2).
export const LARGEUR_MOYENNE = 1200;
export const LARGEUR_PARTAGE = 1200;

const cache = new Map();

export async function dimensions(src) {
  if (!cache.has(src)) {
    const { width, height } = await sharp(path.join('public', src)).metadata();
    cache.set(src, { width, height });
  }
  return cache.get(src);
}

// Couleur moyenne (calculée au build) : fond de la case tant que l'image n'est pas chargée.
// La moyenne plutôt que la « dominante » de sharp, qui donne du noir pour la plupart des affiches sombres.
const couleurs = new Map();
export async function couleurAttente(src) {
  if (!couleurs.has(src)) {
    const { isOpaque, channels } = await sharp(path.join('public', src)).stats();
    const [r, g, b] = channels.slice(0, 3).map((c) => Math.round(c.mean));
    // Image avec transparence : le fond coloré resterait visible derrière elle une fois chargée.
    couleurs.set(src, isOpaque ? `rgb(${r} ${g} ${b})` : 'transparent');
  }
  return couleurs.get(src);
}

const nom = (src) => path.basename(src, path.extname(src));
export const urlVignette = (src, largeur = LARGEUR_VIGNETTE) => `/images/vignettes/${nom(src)}-${largeur}.webp`;
export const urlPartage = (src) => `/images/partage/${nom(src)}.jpg`;

// srcset « vignette (+ moyenne) + original » ; en dev les variantes n'existent pas encore, on sert l'original seul.
export async function srcsetVignette(src) {
  const { width } = await dimensions(src);
  if (import.meta.env.DEV || width <= LARGEUR_VIGNETTE) return undefined;
  const moyenne = width > LARGEUR_MOYENNE ? `${urlVignette(src, LARGEUR_MOYENNE)} ${LARGEUR_MOYENNE}w, ` : '';
  return `${urlVignette(src)} ${LARGEUR_VIGNETTE}w, ${moyenne}${src} ${width}w`;
}

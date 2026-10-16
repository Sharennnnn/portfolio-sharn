// Intégration Astro : après le build, place la 404 anglaise et crée les vignettes (640 px, WebP) et les images de
// partage (1200 px, JPEG pour les réseaux sociaux) à partir de dist/images/projets/.
import sharp from 'sharp';
import { readdir, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LARGEUR_VIGNETTE, LARGEUR_PARTAGE } from './images.js';
import { verifierCsp } from './verifier-csp.js';

export default function variantesImages() {
  return {
    name: 'variantes-images',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const racine = fileURLToPath(dir);
        const source = path.join(racine, 'images/projets');
        const vignettes = path.join(racine, 'images/vignettes');
        const partage = path.join(racine, 'images/partage');
        await mkdir(vignettes, { recursive: true });
        await mkdir(partage, { recursive: true });
        const fichiers = (await readdir(source)).filter((f) => /\.(webp|jpe?g|png)$/i.test(f));
        for (const f of fichiers) {
          const entree = path.join(source, f);
          const base = path.basename(f, path.extname(f));
          const { width } = await sharp(entree).metadata();
          if (width > LARGEUR_VIGNETTE) {
            await sharp(entree).resize({ width: LARGEUR_VIGNETTE }).webp({ quality: 78 }).toFile(path.join(vignettes, `${base}-${LARGEUR_VIGNETTE}.webp`));
          }
          await sharp(entree).resize({ width: Math.min(width, LARGEUR_PARTAGE) }).flatten({ background: '#0a0a0b' }).jpeg({ quality: 82 }).toFile(path.join(partage, `${base}.jpg`));
        }
        logger.info(`${fichiers.length} images : vignettes et images de partage générées`);

        // Cloudflare Pages cherche en/404.html ; Astro ne produit 404.html qu'à la racine.
        await rename(path.join(racine, 'en/404/index.html'), path.join(racine, 'en/404.html'));
        await rm(path.join(racine, 'en/404'), { recursive: true });

        logger.info(`CSP vérifiée sur ${await verifierCsp(racine)} pages`);
      },
    },
  };
}

import { getEntry } from 'astro:content';

// Lit src/content/reglages/site.yaml et renvoie l'entrée unique.
export async function lireReglages() {
  const entree = await getEntry('reglages', 'site');
  return entree.data;
}

import { getEntry } from 'astro:content';

// Lit src/content/reglages/site.yaml et renvoie l'entrée unique.
export async function lireReglages() {
  const entree = await getEntry('reglages', 'site');
  return entree.data;
}

// Renvoie un champ dans la bonne langue : cherche `${base}_en` si langue=en et
// que le champ existe, sinon retombe sur le français. Fonctionne sur des
// chaînes portées par un objet (ex: item.titre / item.titre_en).
export function champR(objet, base, langue) {
  if (langue === 'en' && objet[`${base}_en`]) return objet[`${base}_en`];
  return objet[base];
}

// Variante pour une liste de chaînes (ex: bio / bio_en).
export function listeR(objet, base, langue) {
  if (langue === 'en' && objet[`${base}_en`]) return objet[`${base}_en`];
  return objet[base];
}

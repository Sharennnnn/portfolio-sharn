import { ui, langueDefaut, chemins } from './ui.js';

export function langueDepuisUrl(url) {
  const [, segment] = url.pathname.split('/');
  return segment in ui ? segment : langueDefaut;
}

export function traduire(langue) {
  return (cle) => ui[langue]?.[cle] ?? ui[langueDefaut][cle] ?? cle;
}

export function route(langue, nom) {
  return chemins[langue][nom];
}

export function urlProjet(langue, id) {
  return langue === 'en' ? `/en/work/${id}/` : `/projets/${id}/`;
}

// Renvoie objet[`${base}_en`] en anglais s'il est rempli, sinon objet[base] (français).
export function champ(objet, base, langue) {
  if (langue === 'en' && objet[`${base}_en`]) return objet[`${base}_en`];
  return objet[base];
}

export function autreLangue(langue) {
  return langue === 'fr' ? 'en' : 'fr';
}

export function trier(projets) {
  return [...projets].sort((a, b) => a.data.ordre - b.data.ordre || b.data.annee - a.data.annee);
}

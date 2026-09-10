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
  return langue === 'en' ? `/en/work/${id}` : `/projets/${id}`;
}

export function champ(projet, base, langue) {
  if (langue === 'en' && projet.data[`${base}_en`]) return projet.data[`${base}_en`];
  return projet.data[base];
}

export function trier(projets) {
  return [...projets].sort((a, b) => a.data.ordre - b.data.ordre || b.data.annee - a.data.annee);
}

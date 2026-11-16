// Clé de tri « Date » d'un projet : « 2026-03-10 » si la date précise est remplie, sinon « 2026 ».
// En ordre décroissant, « 2026 » passe donc après les projets datés de la même année.
export function cleDate(data) {
  return data.date ? data.date.toISOString().slice(0, 10) : String(data.annee);
}

// Ordre des projets choisi sur la page Projets. Chaque élément : { rang, titre, date },
// où rang est la position par défaut (ordre de l'admin) et date une clé de cleDate(). Renvoie une nouvelle liste.
export function ordonner(elements, mode, langue) {
  const parRang = (a, b) => a.rang - b.rang;
  const liste = [...elements];
  if (mode === 'alpha') {
    // « É » rangé avec « E », « 2 » avant « 10 ».
    const { compare } = new Intl.Collator(langue, { sensitivity: 'base', numeric: true });
    return liste.sort((a, b) => compare(a.titre, b.titre) || parRang(a, b));
  }
  if (mode === 'date') return liste.sort((a, b) => (a.date < b.date) - (a.date > b.date) || parRang(a, b));
  return liste.sort(parRang);
}

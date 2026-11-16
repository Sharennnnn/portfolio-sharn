// Ordre des projets choisi sur la page Projets. Chaque élément : { rang, titre, annee },
// où rang est la position par défaut (ordre de l'admin). Renvoie une nouvelle liste.
export function ordonner(elements, mode, langue) {
  const parRang = (a, b) => a.rang - b.rang;
  const liste = [...elements];
  if (mode === 'alpha') {
    // « É » rangé avec « E », « 2 » avant « 10 ».
    const { compare } = new Intl.Collator(langue, { sensitivity: 'base', numeric: true });
    return liste.sort((a, b) => compare(a.titre, b.titre) || parRang(a, b));
  }
  if (mode === 'date') return liste.sort((a, b) => b.annee - a.annee || parRang(a, b));
  return liste.sort(parRang);
}

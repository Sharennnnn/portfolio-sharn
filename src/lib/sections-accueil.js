// Ordre des sections de l'accueil : celles de l'admin, plus celles qui se déduisent du contenu existant
// (aucune case dans l'admin : elles apparaissent dès que leurs données existent).
export function sectionsAccueil(cles) {
  const ordre = ['bandeau', ...cles];
  ordre.splice(ordre.includes('selection') ? ordre.indexOf('selection') + 1 : 1, 0, 'apropos');
  const fin = ordre.includes('cta') ? ordre.indexOf('cta') : ordre.length;
  ordre.splice(fin, 0, 'realise', 'index');
  return ordre;
}

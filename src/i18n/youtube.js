// Extrait l'ID d'une vidéo YouTube depuis n'importe quel format de lien courant
// (youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID) et renvoie
// l'URL d'intégration prête pour un <iframe>. Renvoie null si le lien ne
// correspond à aucun format reconnu.
export function idYoutube(lien) {
  if (!lien) return null;
  const motifs = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ];
  for (const motif of motifs) {
    const trouve = lien.match(motif);
    if (trouve) return trouve[1];
  }
  return null;
}

export function urlIntegrationYoutube(lien) {
  const id = idYoutube(lien);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

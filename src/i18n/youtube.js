// Extrait l'ID d'une vidéo YouTube depuis les formats de lien courants (youtu.be/ID, watch?…v=ID,
// embed/ID, shorts/ID, live/ID, youtube-nocookie) et renvoie l'URL d'intégration prête pour un <iframe>.
// Renvoie null si le lien ne correspond à aucun format reconnu. Tests : youtube.test.js.
const MOTIF = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/;

export function idYoutube(lien) {
  return lien?.match(MOTIF)?.[1] ?? null;
}

export function urlIntegrationYoutube(lien) {
  const id = idYoutube(lien);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

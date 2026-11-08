// Calendrier du couloir d'affiches : que se passe-t-il à l'avancement u ?
// u va de 0 à n (n arrêts). Étape k : la caméra avance jusqu'à l'arrêt k pendant [k, k + AVANCE[, puis s'y arrête.
// Sans DOM ni Three.js, pour pouvoir être testé seul.

export const AVANCE = 0.55;

export const rampe = (x, a, b) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Position de la caméra en arrêts : -1 à l'entrée du couloir, k à l'arrêt k.
export function position(u, n) {
  const v = Math.min(n, Math.max(0, u));
  const k = Math.min(n - 1, Math.floor(v));
  return k - 1 + rampe(v - k, 0, AVANCE);
}

// Présence de l'arrêt k (son lien, son cartel, sa vraie image) : 1 seulement quand la caméra y est immobile.
export function presence(u, k, n) {
  const arrive = rampe(u, k + AVANCE - 0.05, k + AVANCE);
  return k === n - 1 ? arrive : arrive * (1 - rampe(u, k + 0.97, k + 1));
}

export const opaciteHero = (u) => 1 - rampe(u, 0.02, 0.2);
export const opaciteEntete = (u) => rampe(u, 0.32, 0.5);

// Où scroller pour montrer l'arrêt k (clavier) : au milieu de son immobilité, en avancement u.
export const milieuArret = (k) => k + (AVANCE + 1) / 2;

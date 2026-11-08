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

// Côté du mur de l'arrêt k : 1 à droite, -1 à gauche, en alternance.
export const coteArret = (k) => (k % 2 ? -1 : 1);

// Pose fixe de la caméra : -1 à l'entrée, k face à l'affiche sur son mur, le dernier arrêt face aux portes.
function poseFixe(k, n, g) {
  if (k < 0) return { x: 0, z: g.zDepart, yaw: 0 };
  if (k >= n - 1) return { x: 0, z: g.zArret(k), yaw: 0 };
  const c = coteArret(k);
  return { x: c * (g.demiLargeur - g.recul), z: g.zArret(k), yaw: -c * Math.PI / 2 };
}

// Trajet entre deux poses : se détourne du mur, marche dans le couloir, se tourne vers le mur suivant.
// g = { demiLargeur, recul, zDepart, zArret(k) }
export function camera(p, n, g) {
  const k = Math.ceil(p);
  const a = poseFixe(k - 1, n, g);
  const b = poseFixe(k, n, g);
  const t = p - (k - 1);
  const marche = rampe(t, 0.15, 0.85);
  return {
    x: a.x + (b.x - a.x) * marche,
    z: a.z + (b.z - a.z) * marche,
    yaw: a.yaw * (1 - rampe(t, 0, 0.35)) + b.yaw * rampe(t, 0.65, 1),
  };
}

// Élan entre deux arrêts (0 à l'arrêt, 1 à mi-chemin) : la caméra s'élargit et penche un peu en marchant.
export const elan = (p) => Math.sin((p - Math.floor(p)) * Math.PI) ** 2;

// Présence de l'arrêt k (son lien, son cartel, sa vraie image) : 1 seulement quand la caméra y est immobile.
export function presence(u, k, n) {
  const arrive = rampe(u, k + AVANCE - 0.05, k + AVANCE);
  return k === n - 1 ? arrive : arrive * (1 - rampe(u, k + 0.97, k + 1));
}

export const opaciteHero = (u) => 1 - rampe(u, 0.02, 0.2);
export const opaciteEntete = (u) => rampe(u, 0.32, 0.5);

// Où scroller pour montrer l'arrêt k (clavier) : au milieu de son immobilité, en avancement u.
export const milieuArret = (k) => k + (AVANCE + 1) / 2;

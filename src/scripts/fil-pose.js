// Trajectoire de l'affiche qui suit le visiteur sur l'accueil : pour une position de scroll, où est-elle ?
// Coordonnées d'écran en px (x, y = centre de l'affiche, l = largeur), angles en radians.
// Sans DOM ni Three.js, pour pouvoir être testée seule.

const melange = (a, b, t) => a + (b - a) * t;
// smootherstep : part et arrive sans à-coup, borné entre 0 et 1.
const avancee = (s, debut, fin) => {
  const t = Math.min(1, Math.max(0, (s - debut) / (fin - debut)));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// Demi-tours de l'affiche (chaque demi-tour découvre le projet suivant). m.tours = [[début, fin], …]
const demiTours = (s, m) => m.tours.reduce((n, [a, b]) => n + avancee(s, a, b), 0);

/**
 * @param s scroll en px
 * @param m repères de la page (voir mesurer() dans fil-affiche.js)
 * @param vivants carte() et case() : rectangle actuel de la case de la grille et de la place finale
 * @returns la pose, ou null quand l'affiche n'a pas à être dessinée
 */
export function calculerPose(s, m, vivants) {
  const ry = demiTours(s, m) * Math.PI;

  // Du mur à sa case dans la sélection. Arrivée exacte : la vraie carte prend le relais, sans saut.
  if (s < m.pose) {
    const carte = vivants.carte();
    const t = avancee(s, 0, m.pose);
    return {
      x: melange(m.mur.x, carte.x, t),
      y: melange(m.mur.y, carte.y, t),
      l: melange(m.mur.l, carte.l, t),
      rz: melange(m.mur.rz, 0, t),
      ry,
    };
  }
  // Posée : la vraie carte reste visible et cliquable.
  if (s < m.entree) return null;

  // Colonne libre à droite (services, outils), puis coin haut droit (parcours), puis sortie par la droite.
  if (s < m.sortieFin) {
    const entre = 1 - avancee(s, m.entree, m.entreeFin);
    const sort = avancee(s, m.sortie, m.sortieFin);
    const coin = avancee(s, m.coin, m.coinFin);
    const l = melange(m.rail.l, m.coinPose.l, coin);
    const balance = Math.sin(((s - m.entree) / m.vh) * 1.6) * (1 - coin); // vit doucement au scroll, jamais toute seule
    return {
      x: melange(m.rail.x, m.coinPose.x, coin) + (m.vw + l - m.rail.x) * Math.max(entre, sort),
      y: melange(m.rail.y, m.coinPose.y, coin),
      l,
      rz: balance * 0.035,
      ry: ry + balance * 0.16,
    };
  }
  if (s < m.fin) return null;

  // Arrive par la droite à hauteur de sa place : elle ne traverse jamais le grand titre, placé au-dessus.
  const place = vivants.case();
  const t = avancee(s, m.fin, m.finPose);
  return { x: melange(m.vw + place.l, place.x, t), y: place.y, l: place.l, rz: -0.07 * t, ry };
}

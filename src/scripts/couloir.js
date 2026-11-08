// ESSAI — l'accueil devient un couloir d'affiches : le scroll fait avancer la caméra, chaque projet phare
// arrive en plein écran, puis on le traverse. Les liens restent ceux des cartes, toujours focalisables.
// Rien ne bouge sans geste du visiteur. Sans WebGL matériel ou avec animations réduites : accueil classique.
import { WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Mesh, TextureLoader, DoubleSide, MathUtils, Vector2 } from 'three';
import { AVANCE, position, presence, rampe, opaciteHero, opaciteEntete, milieuArret } from './couloir-temps.js';

const FOV = 50;
const ECART = 9; // distance entre deux arrêts
const RECUL = 3; // distance caméra - affiche à l'arrêt
const TAN = Math.tan(MathUtils.degToRad(FOV / 2));
const RATIO = 4 / 3;

const VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
// Pixels de l'image tels quels, recadrés comme object-fit: cover. Le fondu passe par l'alpha : marche sur les deux thèmes.
const FS = `precision mediump float;
uniform sampler2D carte;uniform vec2 cadre;uniform float alpha;varying vec2 vUv;
void main(){vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;
gl_FragColor=vec4(texture2D(carte,(uv-.5)*cadre+.5).rgb,alpha);}`;

const hautPage = (el) => {
  let y = 0;
  for (let e = el; e; e = e.offsetParent) y += e.offsetTop;
  return y;
};

export function lancerCouloir(canvas, gabarit) {
  const html = document.documentElement;
  const couloir = canvas.closest('.couloir');
  const scene3d = canvas.parentElement;
  const heroScene = scene3d.querySelector('.hero-scene');
  const heroTexte = scene3d.querySelector('.hero-texte');
  const bloc = couloir.nextElementSibling; // shortcut: pas de couloir si l'admin ne met pas la sélection juste après le hero.
  const entete = bloc?.querySelector('.entete-bloc');
  const cartes = bloc ? [...bloc.querySelectorAll('.selection > .carte')] : [];
  const tuile = bloc?.querySelector('.tuile-tout');
  if (!cartes.length || !entete || !tuile) return;
  const arrets = [...cartes, tuile];
  const n = arrets.length;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
  } catch {
    return;
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 80);
  const geometrie = new PlaneGeometry(1, 1);
  const plan = (texture) => {
    const a = texture.image.width / texture.image.height;
    const cadre = a > 1 / RATIO ? new Vector2(1 / RATIO / a, 1) : new Vector2(1, a * RATIO);
    const mesh = new Mesh(geometrie, new ShaderMaterial({
      vertexShader: VS, fragmentShader: FS, side: DoubleSide, transparent: true, depthWrite: false,
      uniforms: { carte: { value: texture }, cadre: { value: cadre }, alpha: { value: 0 } },
    }));
    scene.add(mesh);
    return mesh;
  };

  let centraux = [], murs = [], actif = false, boucle = 0, lisse = 0, vw = 1, vh = 1, haut = 0, course = 1, etroit = false;
  const souris = { x: 0, y: 0, cx: 0, cy: 0 };

  const zArret = (k) => -(k + 1) * ECART;
  const zCamera = (p) => zArret(p) + RECUL;

  const mesurer = () => {
    vw = html.clientWidth;
    vh = scene3d.offsetHeight;
    haut = hautPage(couloir);
    course = Math.max(1, couloir.offsetHeight - vh);
    etroit = vw / vh < 5 / 4;
    renderer.setPixelRatio(Math.min(devicePixelRatio, etroit ? 1.5 : 2));
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;

    // À l'arrêt, l'affiche 3D tombe exactement sur la vraie carte : mêmes pixels, sans saut au fondu.
    const vue = 2 * RECUL * TAN; // hauteur visible à la distance d'arrêt
    const parPx = vue / vh;
    const visuel = cartes[0].querySelector('.carte-visuel');
    const hPx = visuel.offsetHeight, lPx = visuel.offsetWidth;
    const yCentre = visuel.offsetTop + hPx / 2 + cartes[0].offsetTop + bloc.offsetTop;
    centraux.forEach((m, k) => {
      m.scale.set(lPx * parPx, hPx * parPx, 1);
      m.position.set(0, (vh / 2 - yCentre) * parPx, zArret(k));
    });
    const xMur = 0.5 + vue * camera.aspect * 0.42;
    murs.forEach((m) => {
      const hMur = etroit ? 1.3 : 2;
      m.scale.set(hMur / RATIO, hMur, 1);
      m.position.x = m.userData.cote * xMur;
    });
    relancer();
  };

  const dessiner = () => {
    const p = position(lisse, n);
    const ouverture = 1 - rampe(lisse, 0, AVANCE);
    // Point de fuite décalé à l'arrivée, pour laisser le texte du hero sur fond calme.
    camera.setViewOffset(vw, vh, etroit ? 0 : -vw * 0.2 * ouverture, etroit ? -vh * 0.22 * ouverture : 0, vw, vh);
    camera.position.set(souris.cx, souris.cy, zCamera(p));

    centraux.forEach((m, k) => {
      const d = camera.position.z - m.position.z;
      // Traversée quand on s'en approche ; apparition depuis le fond ; tourne pour venir se placer de face.
      m.material.uniforms.alpha.value = rampe(d, RECUL * 0.22, RECUL * 0.7) * (1 - rampe(d, 18, 30));
      m.visible = d > 0 && m.material.uniforms.alpha.value > 0;
      m.rotation.y = rampe(d, RECUL, RECUL + 9) * (k % 2 ? -0.7 : 0.7);
      // La souris ne décale que les murs : l'affiche de face reste calée sur la vraie carte.
      m.position.x = souris.cx;
      m.userData.yBase ??= m.position.y;
      m.position.y = m.userData.yBase + souris.cy;
    });
    murs.forEach((m) => {
      const d = camera.position.z - m.position.z;
      m.material.uniforms.alpha.value = rampe(d, 0.3, 1.6) * (1 - rampe(d, 16, 30)) * 0.92;
      m.visible = d > 0 && m.material.uniforms.alpha.value > 0;
    });

    // Couche HTML : hero, en-tête, puis l'arrêt présent. La vraie image prend le relais du plan 3D à l'arrêt.
    const oh = opaciteHero(lisse);
    heroScene.style.opacity = oh;
    heroScene.style.pointerEvents = oh > 0.5 ? '' : 'none';
    entete.style.opacity = opaciteEntete(lisse);
    entete.style.pointerEvents = opaciteEntete(lisse) > 0.5 ? '' : 'none';
    arrets.forEach((el, k) => {
      const pr = presence(lisse, k, n);
      el.style.opacity = pr;
      el.classList.toggle('courant', pr > 0.5);
    });
    renderer.render(scene, camera);
  };

  const cibleU = () => MathUtils.clamp((scrollY - haut) / course, 0, 1) * n;
  let derniere = performance.now();
  const image = (t) => {
    const dt = Math.min((t - derniere) / 1000, 0.1);
    derniere = t;
    const k = 1 - Math.pow(1 - 0.14, dt * 60);
    const c = cibleU();
    lisse += (c - lisse) * k;
    if (Math.abs(c - lisse) < 0.0004) lisse = c;
    souris.cx += (souris.x - souris.cx) * k;
    souris.cy += (souris.y - souris.cy) * k;
    if (Math.abs(souris.x - souris.cx) + Math.abs(souris.y - souris.cy) < 0.0005) { souris.cx = souris.x; souris.cy = souris.y; }
    dessiner();
    boucle = lisse !== c || souris.cx !== souris.x || souris.cy !== souris.y ? requestAnimationFrame(image) : 0;
  };
  function relancer() {
    if (actif && !boucle) { derniere = performance.now(); boucle = requestAnimationFrame(image); }
  }

  const allerA = (u) => scrollTo({ top: haut + (u / n) * course, behavior: 'instant' });
  const auFocus = (e) => {
    const k = arrets.findIndex((el) => el.contains(e.target));
    if (k >= 0) allerA(milieuArret(k));
    else if (entete.contains(e.target)) allerA(milieuArret(0));
    else if (heroScene.contains(e.target)) scrollTo({ top: 0, behavior: 'instant' });
  };
  const bouger = (e) => {
    souris.x = (e.clientX / innerWidth - 0.5) * 0.35;
    souris.y = (0.5 - e.clientY / innerHeight) * 0.22;
    relancer();
  };

  const activer = (oui) => {
    if (actif === oui) return true;
    actif = oui;
    html.classList.toggle('couloir-actif', oui);
    if (oui) {
      html.style.setProperty('--etapes', n);
      scene3d.append(bloc);
      // Texte du hero plus haut que l'écran (zoom, petit téléphone) : il serait coupé, donc accueil classique.
      if (heroTexte.getBoundingClientRect().bottom - heroScene.getBoundingClientRect().top > scene3d.offsetHeight - 8) {
        activer(false);
        return false;
      }
      lisse = cibleU();
      mesurer();
      html.classList.add('couloir-pret');
      couloir.addEventListener('focusin', auFocus);
      addEventListener('pointermove', bouger, { passive: true });
    } else {
      html.classList.remove('couloir-pret');
      couloir.after(bloc);
      couloir.removeEventListener('focusin', auFocus);
      removeEventListener('pointermove', bouger);
      for (const el of [heroScene, entete, ...arrets]) { el.style.opacity = ''; el.style.pointerEvents = ''; el.classList.remove('courant'); }
      if (boucle) { cancelAnimationFrame(boucle); boucle = 0; }
    }
    return true;
  };

  canvas.addEventListener('webglcontextlost', () => { activer(false); canvas.remove(); });

  const donnees = JSON.parse(canvas.dataset.images);
  const chargeur = new TextureLoader();
  const charger = (u) => chargeur.loadAsync(u);
  // Écran en hauteur (téléphone) : moitié moins d'affiches différentes sur les murs, pour les données et la mémoire.
  const imagesMur = innerWidth / innerHeight < 5 / 4 ? donnees.mur.slice(0, 6) : donnees.mur;
  Promise.all([Promise.all(donnees.projets.map(charger)), Promise.all(imagesMur.map(charger))]).then(([projets, mur]) => {
    // Déjà loin dans la page (retour, rechargement) : on ne bouscule pas ce qu'il lit.
    // shortcut: l'accueil reste classique pour cette visite ; à revoir si le couloir est gardé.
    if (scrollY > innerHeight * 0.3 || !gabarit.matches) return;
    for (const t of [...projets, ...mur]) renderer.initTexture(t);
    centraux = projets.slice(0, cartes.length).map(plan);
    // Murs du couloir : alternance gauche / droite, hauteurs variées (suite fixe, même rendu à chaque visite).
    const longueur = (n + 1) * ECART;
    for (let i = 0, z = 0.5; z < longueur; i++, z += 1.6) {
      const m = plan(mur[i % mur.length]);
      const cote = i % 2 ? 1 : -1;
      m.userData.cote = cote;
      m.position.y = [0.55, -0.7, 0.15, -0.3, 0.8, -0.55, 0.35][i % 7];
      m.position.z = -z;
      m.rotation.y = -cote * 1.02;
      murs.push(m);
    }
    if (!activer(true)) return;
    addEventListener('scroll', relancer, { passive: true });
    new ResizeObserver(() => { if (actif) mesurer(); }).observe(document.body);
    gabarit.addEventListener('change', (e) => activer(e.matches));
  }, () => {}); // image manquante : accueil classique
}

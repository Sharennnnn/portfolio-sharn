// ESSAI — fil conducteur de l'accueil : une affiche en 3D accompagne le scroll, sans jamais passer sur un texte.
// Elle ne bouge que si le visiteur scrolle (rien à mettre en pause, WCAG 2.2.2). Sans WebGL matériel : page normale.
import { WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Mesh, TextureLoader, Vector2, DoubleSide, MathUtils } from 'three';
import { calculerPose } from './fil-pose.js';

const FOV = 30;
const RATIO = 4 / 3; // hauteur / largeur, comme les cartes
const VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
// Pixels de l'image tels quels (pas de tone mapping), recadrés comme object-fit: cover ; verso remis à l'endroit ; léger reflet quand elle tourne.
const FS = `precision mediump float;
uniform sampler2D carte;uniform vec2 cadre;uniform float reflet;varying vec2 vUv;
void main(){vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;
uv=(uv-.5)*cadre+.5;vec4 c=texture2D(carte,uv);
gl_FragColor=vec4(c.rgb+reflet*smoothstep(1.2,0.,abs(vUv.x-vUv.y))*.18,1.);}`;

// Position dans la page sans les translate des animations de scroll.
const hautPage = (el) => {
  let y = 0;
  for (let e = el; e; e = e.offsetParent) y += e.offsetTop;
  return y;
};
const centre = (el, l = el.getBoundingClientRect().width) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, l };
};

export function lancerFilAffiche(canvas, gabarit) {
  const q = (s) => document.querySelector(s);
  const carteImg = q('.selection > :nth-child(2) .carte-visuel img');
  const papier = q('.chapitre--papier');
  const accent = q('.chapitre--accent');
  const frise = q('.chapitre--frise');
  const collant = q('.frise-collant');
  const liste = q('.frise');
  const ctaBas = q('.cta-bas');
  const mur = q('.mur');
  const enveloppe = q('.chapitre--papier .enveloppe');
  // shortcut: si l'admin masque une de ces rubriques, pas d'affiche ; à rendre souple si l'essai est gardé.
  if (!carteImg || !papier || !accent || !frise || !collant || !liste || !ctaBas || !mur) return;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
  } catch {
    return; // pas de WebGL matériel : le site reste tel quel
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 1, 100000); // distances en pixels, comme affiche-3d.js
  const uniforms = { carte: { value: null }, cadre: { value: new Vector2(1, 1) }, reflet: { value: 0 } };
  const plan = new Mesh(new PlaneGeometry(1, 1), new ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms, side: DoubleSide, transparent: true }));
  scene.add(plan);

  let m, boucle = 0, actif = false, faceAffichee = -1, textures = [], lisse = scrollY, cw = 0, ch = 0;
  const html = document.documentElement;

  const place = () => {
    const r = ctaBas.getBoundingClientRect();
    const l = m.rail.l;
    return { x: r.right - l / 2, y: r.top + (l * RATIO) / 2, l };
  };
  const vivants = { carte: () => centre(carteImg), case: place };

  const mesurer = () => {
    const vw = html.clientWidth, vh = innerHeight;
    const lRail = Math.round(MathUtils.clamp(vw * 0.16, 192, 272));
    html.style.setProperty('--rail', `${lRail}px`);
    const droite = enveloppe.getBoundingClientRect().right - parseFloat(getComputedStyle(enveloppe).paddingLeft);
    const hRail = lRail * RATIO;
    const yRail = Math.max(vh / 2, 96 + hRail / 2);
    const rail = { x: droite - lRail / 2, y: yRail, l: lRail };

    // Parcours : au-dessus de la frise si elle est collante, sinon l'affiche garde sa colonne.
    const estCollant = getComputedStyle(collant).position === 'sticky';
    const hautListe = estCollant ? liste.offsetTop : Infinity;
    const lCoin = Math.min(lRail, ((hautListe - 80 - 24) || 0) / RATIO);
    const coinPose = estCollant ? { x: droite - lCoin / 2, y: 80 + (lCoin * RATIO) / 2, l: lCoin } : rail;

    const yCarte = hautPage(carteImg);
    const pose = Math.max(1, yCarte - vh * 0.2);
    const entree = Math.max(pose + 1, hautPage(papier) - (yRail - hRail / 2) + 40);
    const entreeFin = entree + vh * 0.4;
    const yAccent = hautPage(accent);
    const yFrise = hautPage(frise);
    const coin = yFrise - vh * 0.5;
    const coinFin = yFrise;
    const sortie = yFrise + frise.offsetHeight - vh;
    const sortieFin = sortie + vh * 0.2;
    const yPlace = hautPage(ctaBas);
    const fin = Math.max(sortieFin + 1, yPlace - vh);
    const maxi = html.scrollHeight - vh;
    const finPose = Math.min(maxi, Math.max(fin + 1, yPlace + lRail * RATIO + 40 - vh));

    const murR = mur.getBoundingClientRect();
    // offsetWidth : la taille de la carte sans ses animations d'entrée. Même taille sur le mur que dans sa case.
    const lMur = carteImg.offsetWidth;
    m = {
      vw, vh, pose, entree, entreeFin, rail, coin, coinFin, coinPose, sortie, sortieFin, fin, finPose,
      mur: { x: murR.left + murR.width / 2, y: hautPage(mur) + mur.offsetHeight / 2, l: lMur, rz: -0.09 },
      tours: [
        [0, pose],
        [entree, entreeFin],
        [yAccent - vh * 0.35, yAccent - vh * 0.05], // au passage du papier à l'orange
        [(coinFin + sortie) / 2 - vh * 0.2, (coinFin + sortie) / 2 + vh * 0.2],
        [fin, finPose],
      ],
    };

    // Canvas juste assez grand pour l'affiche en mouvement : il se déplace, il ne recouvre pas la page.
    const lMax = Math.max(lMur, lRail);
    cw = Math.ceil(lMax * 1.5);
    ch = Math.ceil(lMax * RATIO * 1.5);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
    camera.position.z = ch / 2 / Math.tan(MathUtils.degToRad(FOV / 2));
    camera.updateProjectionMatrix();
    relancer();
  };

  const montrerFace = (ry) => {
    const face = MathUtils.clamp(Math.round(ry / Math.PI), 0, textures.length - 1);
    if (face === faceAffichee) return;
    faceAffichee = face;
    const t = textures[face];
    const a = t.image.width / t.image.height;
    uniforms.carte.value = t;
    // Recadrage cover vers le format 3:4.
    if (a > 1 / RATIO) uniforms.cadre.value.set(1 / RATIO / a, 1);
    else uniforms.cadre.value.set(1, a * RATIO);
  };

  const dessiner = () => {
    const p = calculerPose(lisse, m, vivants);
    canvas.style.visibility = p ? 'visible' : 'hidden';
    if (!p) return;
    canvas.style.transform = `translate3d(${(p.x - cw / 2).toFixed(1)}px,${(p.y - ch / 2).toFixed(1)}px,0)`;
    plan.scale.set(p.l, p.l * RATIO, 1);
    plan.rotation.set(0, p.ry, p.rz);
    montrerFace(p.ry);
    uniforms.reflet.value = Math.abs(Math.sin(p.ry));
    renderer.render(scene, camera);
  };

  let derniere = performance.now();
  const image = (maintenant) => {
    const dt = Math.min((maintenant - derniere) / 1000, 0.1);
    derniere = maintenant;
    lisse += (scrollY - lisse) * (1 - Math.pow(1 - 0.16, dt * 60)); // amorti indépendant de la fréquence d'écran
    if (Math.abs(scrollY - lisse) < 0.3) lisse = scrollY;
    dessiner();
    boucle = lisse !== scrollY ? requestAnimationFrame(image) : 0;
  };
  function relancer() {
    if (actif && !boucle) { derniere = performance.now(); boucle = requestAnimationFrame(image); }
  }

  const activer = (oui) => {
    actif = oui;
    html.classList.toggle('fil-actif', oui);
    canvas.classList.toggle('pret', oui);
    if (oui) mesurer();
    else if (boucle) { cancelAnimationFrame(boucle); boucle = 0; }
  };

  // Contexte perdu (veille, trop d'onglets) : on rend la page normale.
  canvas.addEventListener('webglcontextlost', () => { activer(false); canvas.remove(); });

  const chargeur = new TextureLoader();
  Promise.all(JSON.parse(canvas.dataset.images).map((u) => chargeur.loadAsync(u))).then((liste) => {
    textures = liste;
    for (const t of textures) renderer.initTexture(t); // envoyées à la carte graphique dès maintenant : pas d'à-coup au premier demi-tour
    activer(true);
    addEventListener('scroll', relancer, { passive: true });
    new ResizeObserver(() => { if (actif) mesurer(); }).observe(document.body);
    gabarit.addEventListener('change', (e) => activer(e.matches));
  }, () => {}); // image manquante : pas d'affiche, le site reste tel quel
}

// ESSAI — l'accueil devient un couloir de cinéma : le scroll fait marcher le visiteur entre deux murs d'affiches
// dans leurs caissons lumineux. À chaque arrêt, il se tourne vers le mur et un projet phare remplit l'écran.
// Les liens restent ceux des cartes, toujours focalisables. Rien ne bouge sans geste du visiteur.
// Sans WebGL matériel ou avec animations réduites : accueil classique.
import { WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, BoxGeometry, ShaderMaterial, Mesh, TextureLoader, BackSide, MathUtils, Vector2, Vector3 } from 'three';
import { AVANCE, position, presence, rampe, opaciteHero, opaciteEntete, milieuArret, camera as trajet, coteArret } from './couloir-temps.js';

const FOV = 50;
const TAN = Math.tan(MathUtils.degToRad(FOV / 2));
const RATIO = 4 / 3;
const CASES_PAR_ARRET = 3; // une affiche de projet toutes les trois cases du mur

// Affiche dans son caisson : pixels de l'image tels quels (cover), cadre sombre, liseré de lumière, fondu au loin.
const VS_AFFICHE = 'varying vec2 vUv;varying vec3 vP;void main(){vUv=uv;vP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.);}';
const FS_AFFICHE = `precision highp float;
uniform sampler2D carte;uniform vec2 cadre,taille;uniform float marge;uniform vec3 fond,lumiere;varying vec2 vUv;varying vec3 vP;
void main(){vec2 q=(vUv-.5)*(taille+2.*marge);vec2 e=abs(q)-taille*.5;float dehors=max(e.x,e.y);
vec3 c;if(dehors<0.){c=texture2D(carte,(q/taille)*cadre+.5).rgb;}
else{c=mix(lumiere,vec3(.035),smoothstep(0.,marge*.45,dehors));}
c=mix(c,fond,smoothstep(9.,34.,distance(vP,cameraPosition)));
gl_FragColor=vec4(c,1.);}`;

// Le couloir lui-même, en une seule boîte vue de l'intérieur : moquette, plafond à spots, murs, portes du fond.
const VS_COULOIR = 'varying vec3 vP;varying vec3 vN;void main(){vN=normal;vP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.);}';
const FS_COULOIR = `precision highp float;
uniform vec3 fond,accent;uniform float clair,pas,demi,yAffiche,yBas,yHaut,zFin;uniform vec2 taille;varying vec3 vP;varying vec3 vN;
void main(){vec3 chaud=vec3(1.,.82,.6);
float zr=mod(vP.z+pas*.5,pas)-pas*.5;
vec3 c;
if(vN.y<-.5){ /* moquette : motif de losanges, flaques de lumière sous les spots */
  vec2 m=vP.xz*7.;float motif=step(.72,abs(sin(m.x+m.y))*abs(sin(m.x-m.y)));
  vec3 base=mix(mix(vec3(.13,.035,.045),vec3(.62,.5,.4),clair),accent,.1);
  c=base*(.8+.25*motif);
  c+=base*mix(1.3,.28,clair)*exp(-(zr*zr)*.9-(vP.x*vP.x)*.35);
  c+=accent*.22*exp(-(demi-abs(vP.x))*5.);
}else if(vN.y>.5){ /* plafond : un spot à chaque case */
  vec3 base=mix(vec3(.03),vec3(.93,.91,.87),clair);
  float d=length(vec2(vP.x,zr));
  c=base+chaud*(smoothstep(.13,.1,d)*1.5+exp(-d*2.6)*mix(.3,.08,clair));
}else if(abs(vN.x)>.5){ /* murs : soubassement, halo des caissons, liseré au sol */
  vec3 base=mix(vec3(.05,.042,.05),vec3(.85,.8,.72),clair);
  base*=.7+.5*smoothstep(yBas,yHaut,vP.y);
  if(vP.y<yBas+.26)base*=mix(.55,.8,clair);
  vec2 q=abs(vec2(zr,vP.y-yAffiche))-taille*.5;
  c=base+chaud*exp(-length(max(q,0.))*3.2)*mix(.26,.05,clair);
  c+=accent*smoothstep(.022,.0,abs(vP.y-yBas-.26))*.8;
}else{ /* fond : deux portes de salle, lumière dessous */
  vec3 base=mix(vec3(.05,.04,.05),vec3(.8,.76,.68),clair);
  vec2 p=vec2(abs(vP.x),vP.y-yBas);
  float haut=(yHaut-yBas)*.82;
  bool porte=p.x<demi*.72&&p.y<haut;
  c=porte?mix(vec3(.2,.035,.05),vec3(.45,.1,.12),clair)*(.75+.35*p.y/haut):base;
  if(porte&&p.x<.012)c=vec3(.01);
  if(p.x<demi*.72&&p.y<.03)c=accent*1.4;
}
c=mix(c,fond,smoothstep(9.,34.,distance(vP,cameraPosition)));
gl_FragColor=vec4(c,1.);}`;

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
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
  } catch {
    return;
  }

  const scene = new Scene();
  const cam = new PerspectiveCamera(FOV, 1, 0.05, 80);
  cam.rotation.order = 'YXZ';
  const couleurs = { fond: { value: new Vector3() }, accent: { value: new Vector3() }, clair: { value: 0 } };
  const plan = new PlaneGeometry(1, 1);
  const boite = new Mesh(new BoxGeometry(1, 1, 1), new ShaderMaterial({
    vertexShader: VS_COULOIR, fragmentShader: FS_COULOIR, side: BackSide,
    uniforms: {
      ...couleurs,
      pas: { value: 1 }, demi: { value: 1 }, yAffiche: { value: 0 }, yBas: { value: -1 }, yHaut: { value: 1 }, zFin: { value: 0 }, taille: { value: new Vector2(1, 1) },
    },
  }));
  scene.add(boite);

  let cases = []; // { mesh, i, cote }
  let actif = false, boucle = 0, lisse = 0, vw = 1, vh = 1, haut = 0, course = 1, etroit = false, geo;
  const souris = { x: 0, y: 0, cx: 0, cy: 0 };

  // Couleurs du site : suivent le thème et l'accent de l'admin.
  const lireCouleur = (nom) => {
    canvas.style.color = `var(${nom})`;
    const v = getComputedStyle(canvas).color.match(/[\d.]+/g).slice(0, 3).map(Number);
    return Math.max(...v) > 1 ? v.map((x) => x / 255) : v;
  };
  const lireTheme = () => {
    couleurs.fond.value.fromArray(lireCouleur('--fond'));
    couleurs.accent.value.fromArray(lireCouleur('--accent'));
    couleurs.clair.value = html.dataset.salle === 'allumee' ? 1 : 0;
  };

  const creerCase = (texture) => {
    const a = texture.image.width / texture.image.height;
    const cadre = a > 1 / RATIO ? new Vector2(1 / RATIO / a, 1) : new Vector2(1, a * RATIO);
    const mesh = new Mesh(plan, new ShaderMaterial({
      vertexShader: VS_AFFICHE, fragmentShader: FS_AFFICHE,
      uniforms: {
        fond: couleurs.fond, carte: { value: texture }, cadre: { value: cadre },
        taille: { value: new Vector2(1, 1) }, marge: { value: 0.05 }, lumiere: { value: new Vector3(1, 0.93, 0.8) },
      },
    }));
    scene.add(mesh);
    return mesh;
  };

  const mesurer = () => {
    vw = html.clientWidth;
    vh = scene3d.offsetHeight;
    haut = hautPage(couloir);
    course = Math.max(1, couloir.offsetHeight - vh);
    etroit = vw / vh < 5 / 4;
    renderer.setPixelRatio(Math.min(devicePixelRatio, etroit ? 1.5 : 2));
    renderer.setSize(vw, vh, false);
    cam.aspect = vw / vh;

    // Largeur du couloir et recul : à l'arrêt, l'affiche 3D tombe exactement sur la vraie carte, sans saut au fondu.
    const demi = etroit ? 1.3 : 2.2;
    const recul = demi + 0.8;
    const parPx = (2 * recul * TAN) / vh;
    const visuel = cartes[0].querySelector('.carte-visuel');
    const l = visuel.offsetWidth * parPx, h = visuel.offsetHeight * parPx;
    const yCentre = visuel.offsetTop + visuel.offsetHeight / 2 + cartes[0].offsetTop + bloc.offsetTop;
    const yAffiche = (vh / 2 - yCentre) * parPx;
    const pas = l + Math.max(0.55, l * 0.4);
    const ecart = pas * CASES_PAR_ARRET;
    const zArret = (k) => -(k + 1) * ecart;
    geo = { demiLargeur: demi, recul, zDepart: pas, zArret };

    const yBas = yAffiche - h / 2 - 0.42, yHaut = yAffiche + h / 2 + 0.5;
    const zFin = zArret(n - 1) - recul * 1.25;
    const zDebut = pas * 3;
    boite.position.set(0, (yBas + yHaut) / 2, (zDebut + zFin) / 2);
    boite.scale.set(demi * 2, yHaut - yBas, zDebut - zFin);
    const u = boite.material.uniforms;
    u.pas.value = pas;
    u.demi.value = demi;
    u.yAffiche.value = yAffiche;
    u.yBas.value = yBas;
    u.yHaut.value = yHaut;
    u.taille.value.set(l, h);

    for (const c of cases) {
      const m = c.mesh;
      m.scale.set(l + 0.1, h + 0.1, 1);
      m.position.set(c.cote * (demi - 0.012), yAffiche, -c.i * pas);
      m.rotation.y = -c.cote * Math.PI / 2;
      m.material.uniforms.taille.value.set(l, h);
      m.visible = -c.i * pas > zFin + 0.5 * pas;
    }
    relancer();
  };

  const dessiner = () => {
    const p = position(lisse, n);
    const ouverture = 1 - rampe(lisse, 0, AVANCE);
    // Point de fuite décalé à l'arrivée, pour laisser le texte du hero sur fond calme.
    cam.setViewOffset(vw, vh, etroit ? 0 : -vw * 0.2 * ouverture, etroit ? -vh * 0.22 * ouverture : 0, vw, vh);

    // Couche HTML : hero, en-tête, puis l'arrêt présent. La vraie image prend le relais du plan 3D à l'arrêt.
    const oh = opaciteHero(lisse);
    heroScene.style.opacity = oh;
    heroScene.style.pointerEvents = oh > 0.5 ? '' : 'none';
    entete.style.opacity = opaciteEntete(lisse);
    entete.style.pointerEvents = opaciteEntete(lisse) > 0.5 ? '' : 'none';
    let present = 0;
    arrets.forEach((el, k) => {
      const pr = presence(lisse, k, n);
      present = Math.max(present, pr);
      el.style.opacity = pr;
      el.classList.toggle('courant', pr > 0.5);
    });

    // La souris fait à peine tourner la tête, sauf à l'arrêt : l'affiche reste calée sur la vraie carte.
    const c = trajet(p, n, geo);
    const libre = 1 - present;
    cam.position.set(c.x, souris.cy * libre * 0.25, c.z);
    cam.rotation.set(souris.cy * libre * 0.12, c.yaw - souris.cx * libre * 0.25, 0);
    renderer.render(scene, cam);
  };

  const cibleU = () => MathUtils.clamp((scrollY - haut) / course, 0, 1) * n;
  let derniere = performance.now();
  const image = (t) => {
    const dt = Math.min((t - derniere) / 1000, 0.1);
    derniere = t;
    const k = 1 - Math.pow(1 - 0.14, dt * 60);
    const cible = cibleU();
    lisse += (cible - lisse) * k;
    if (Math.abs(cible - lisse) < 0.0004) lisse = cible;
    souris.cx += (souris.x - souris.cx) * k;
    souris.cy += (souris.y - souris.cy) * k;
    if (Math.abs(souris.x - souris.cx) + Math.abs(souris.y - souris.cy) < 0.0005) { souris.cx = souris.x; souris.cy = souris.y; }
    dessiner();
    boucle = lisse !== cible || souris.cx !== souris.x || souris.cy !== souris.y ? requestAnimationFrame(image) : 0;
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
    souris.x = e.clientX / innerWidth - 0.5;
    souris.y = 0.5 - e.clientY / innerHeight;
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
      lireTheme();
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

    // Les murs : une case par pas, des deux côtés. Les projets phares prennent les cases de leurs arrêts.
    const dernier = (n + 1) * CASES_PAR_ARRET;
    let j = 0;
    for (let i = -2; i <= dernier; i++) {
      for (const cote of [1, -1]) {
        const k = i / CASES_PAR_ARRET - 1;
        const projet = Number.isInteger(k) && k >= 0 && k < cartes.length && coteArret(k) === cote ? projets[k] : null;
        cases.push({ i, cote, mesh: creerCase(projet ?? mur[j++ % mur.length]) });
      }
    }
    if (!activer(true)) return;
    addEventListener('scroll', relancer, { passive: true });
    new ResizeObserver(() => { if (actif) mesurer(); }).observe(document.body);
    // Interrupteur « Lumières de la salle » : le couloir s'allume avec le site.
    new MutationObserver(() => { if (actif) { lireTheme(); if (!boucle) dessiner(); } }).observe(html, { attributes: true, attributeFilter: ['data-salle', 'style'] });
    gabarit.addEventListener('change', (e) => activer(e.matches));
  }, () => {}); // image manquante : accueil classique
}

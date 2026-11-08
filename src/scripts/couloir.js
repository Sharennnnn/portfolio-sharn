// ESSAI — l'accueil devient un couloir de cinéma : marbre poli qui reflète les affiches, caissons lumineux, faisceaux
// dans la brume. Le scroll fait marcher le visiteur ; à chaque arrêt il se tourne vers un projet phare. Au bout, les
// portes s'ouvrent sur la salle. Les liens restent ceux des cartes, toujours focalisables.
// Après l'allumage (2,5 s), rien ne bouge sans geste du visiteur. Sans WebGL matériel ou animations réduites : accueil classique.
import {
  WebGLRenderer, WebGLRenderTarget, Scene, Group, PerspectiveCamera, PlaneGeometry, BoxGeometry, ConeGeometry, Shape, ExtrudeGeometry, BufferGeometry, BufferAttribute,
  ShaderMaterial, Mesh, InstancedMesh, Points, Object3D, TextureLoader, BackSide, AdditiveBlending, LinearSRGBColorSpace, HalfFloatType, MathUtils, Vector2, Vector3,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AVANCE, position, presence, rampe, opaciteHero, opaciteEntete, milieuArret, camera as trajet, coteArret, elan } from './couloir-temps.js';

const FOV = 50;
const TAN = Math.tan(MathUtils.degToRad(FOV / 2));
const RATIO = 4 / 3;
const CASES_PAR_ARRET = 3; // une affiche de projet toutes les trois cases du mur
const DUREE_ALLUMAGE = 2500;

// Éléments communs aux shaders : brouillard et vague d'allumage le long du couloir.
const COMMUN = `precision highp float;
uniform vec3 fond,accent;uniform float clair,allumage;varying vec3 vP;
float allume(){return smoothstep(0.,3.,allumage*70.+vP.z);}
vec3 brume(vec3 c){return mix(c,fond,smoothstep(10.,38.,distance(vP,cameraPosition)));}`;
const BRUIT = `float h2(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float bruit(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return .5*bruit(p)+.3*bruit(p*2.03+7.)+.2*bruit(p*4.1+13.);}`;
const VS_MONDE = 'varying vec3 vP;varying vec3 vN;varying vec2 vUv;void main(){vUv=uv;vN=normal;vP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.);}';

// Affiche : pixels de l'image tels quels (cover), liseré de lumière, reflet de vitre qui glisse quand on marche.
const FS_AFFICHE = `${COMMUN}
uniform sampler2D carte;uniform vec2 cadre,taille;uniform float marge;varying vec2 vUv;
void main(){vec2 q=(vUv-.5)*(taille+2.*marge);vec2 e=abs(q)-taille*.5;float dehors=max(e.x,e.y);
float on=mix(.1,1.,allume());vec3 c;
if(dehors<0.){c=texture2D(carte,(q/taille)*cadre+.5).rgb*.86; /* sous le seuil du halo : le visuel reste lisible */
  float g=dot(normalize(vP-cameraPosition),vec3(0.,0.,1.));
  c+=vec3(1.,.95,.88)*smoothstep(.08,0.,abs(fract(vUv.x*.5+vUv.y*.2+g*1.3)-.5))*.09;}
else{c=mix(vec3(2.2,2.,1.7),vec3(.025),smoothstep(0.,marge*.5,dehors));}
gl_FragColor=vec4(brume(c*on),1.);}`;

// Caisson : boîte de métal sombre autour de l'affiche.
const VS_CAISSON = 'varying vec3 vP;varying vec3 vN;void main(){vN=normal;vP=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.);}';
const FS_CAISSON = `${COMMUN}
varying vec3 vN;void main(){vec3 c=mix(vec3(.018),vec3(.1),clair)+vec3(.05,.04,.03)*(.5+.5*vN.y)*allume();gl_FragColor=vec4(brume(c),1.);}`;

// Plafond, murs et fond du couloir, en une seule boîte vue de l'intérieur (le sol est à part).
const FS_COULOIR = `${COMMUN}
${BRUIT}
uniform float pas,demi,yAffiche,yBas,yHaut,zFin,ouvert;uniform vec2 taille;varying vec3 vN;
void main(){vec3 chaud=vec3(1.,.8,.58);float on=allume();
float zr=mod(vP.z+pas*.5,pas)-pas*.5;float hauteur=yHaut-yBas;vec3 c;
if(vN.y<-.5)discard;
if(vN.y>.5){ /* plafond : caissons, spots encastrés, gorge lumineuse le long des murs */
  vec3 base=mix(vec3(.012),vec3(.9,.88,.84),clair);
  float d=length(vec2(vP.x,zr));
  float grille=smoothstep(.015,.0,abs(zr-pas*.5+.0))+smoothstep(.015,.0,abs(abs(vP.x)-demi*.62));
  c=base*(1.-grille*.5);
  c+=chaud*on*(smoothstep(.1,.075,d)*4.+exp(-d*2.2)*mix(.16,.05,clair));
  c+=accent*on*1.9*smoothstep(.05,.0,abs(abs(vP.x)-demi*.97));
}else if(abs(vN.x)>.5){ /* murs : tissu sombre, éclairage rasant en coquille au-dessus de chaque caisson, soubassement bois */
  float tissu=fbm(vec2(vP.z*34.,vP.y*5.))*.35+.8;
  vec3 base=mix(vec3(.055,.04,.045),vec3(.78,.72,.64),clair)*tissu;
  float bas=vP.y-yBas,hautD=yHaut-vP.y;
  float coquille=exp(-pow(zr/(.3+hautD*.62),2.))*exp(-hautD*.5);
  vec2 q=abs(vec2(zr,vP.y-yAffiche))-taille*.5;
  float halo=exp(-length(max(q,0.))*3.4);
  c=base*(.32+on*(coquille*mix(2.6,.5,clair)))+chaud*on*(halo*mix(.17,.03,clair)+coquille*mix(.05,.0,clair));
  if(bas<.27){float veines=fbm(vec2(vP.z*2.2,vP.y*40.));
    vec3 bois=mix(vec3(.05,.022,.012),vec3(.34,.2,.12),clair)*(.6+veines);
    c=bois*(.5+.9*on*coquille)+vec3(.8,.5,.25)*.06*on*smoothstep(.012,.0,abs(bas-.27));}
  c+=accent*on*1.8*smoothstep(.016,.0,abs(bas-.285));
  c*=mix(.42,1.,smoothstep(0.,.3,bas))*mix(.5,1.,smoothstep(0.,.55,hautD)); /* angles assombris */
  c*=1.-.65*smoothstep(.02,.0,abs(abs(zr)-pas*.5)); /* joints entre panneaux */
}else{ /* mur du fond : ouverture des portes */
  vec2 p=vec2(abs(vP.x),vP.y-yBas);
  if(p.x<demi*.72&&p.y<hauteur*.82)discard;
  c=mix(vec3(.03,.02,.025),vec3(.7,.65,.58),clair)*(.5+on*.5);
  c+=vec3(1.,.72,.42)*on*1.6*smoothstep(.03,.0,abs(p.y-hauteur*.82-.05))*step(p.x,demi*.72);
}
gl_FragColor=vec4(brume(c),1.);}`;

// Sol : marbre poli. Reflet flouté de plus en plus au loin, plus fort sous un angle rasant (Fresnel).
const FS_SOL = `${COMMUN}
${BRUIT}
uniform sampler2D tReflet;uniform vec2 ecran;uniform float pas,demi,ouvert,zFin,reflets;varying vec3 vN;
void main(){vec2 uv=gl_FragCoord.xy/ecran;uv.y=1.-uv.y;
float zr=mod(vP.z+pas*.5,pas)-pas*.5;
vec3 vue=normalize(cameraPosition-vP);float dist=distance(vP,cameraPosition);
float v1=fbm(vP.xz*1.4+fbm(vP.xz*.9)*3.);float veine=smoothstep(.012,.0,abs(v1-.5));
vec3 base=mix(vec3(.012,.012,.014),vec3(.72,.69,.64),clair);
base+=mix(vec3(.05,.042,.035),vec3(-.16),clair)*veine;
/* dalles */
float joint=smoothstep(.012,.0,abs(fract(vP.x*.55+.5)-.5)-.48)+smoothstep(.012,.0,abs(fract(vP.z*.55)-.5)-.48);
base*=1.-.3*clamp(joint,0.,1.);
vec3 reflet=vec3(0.);
if(reflets>.5){float r=mix(.0015,.012,clamp(dist*.07,0.,1.));
  for(int i=-2;i<=2;i++)for(int j=-1;j<=1;j++)reflet+=texture2D(tReflet,uv+vec2(float(i)*r*.6,float(j)*r*1.6)).rgb;
  reflet/=15.;}
float fres=mix(.2,.92,pow(1.-max(vue.y,0.),3.));
vec3 c=base*(.5+.5*allume())+reflet*fres*mix(1.,.5,clair);
c+=vec3(1.,.82,.6)*allume()*.1*exp(-(zr*zr)*1.2-(vP.x*vP.x)*.5)*mix(1.,.2,clair);
c+=vec3(1.,.74,.45)*ouvert*1.3*exp(-pow(vP.x/(demi*.7),2.))*exp(-max(vP.z-zFin,0.)*.35);
gl_FragColor=vec4(brume(c),1.);}`;

// Battants des portes : cuir rouge capitonné.
const FS_PORTE = `${COMMUN}
varying vec2 vUv;varying vec3 vN;void main(){vec2 p=fract(vUv*vec2(4.,7.))-.5;float bouton=smoothstep(.09,.06,length(p));
vec3 c=mix(vec3(.14,.015,.025),vec3(.5,.1,.12),clair)*(.7+.5*vUv.y)*(1.-dot(p,p)*.7);
c=mix(c,vec3(.55,.38,.14),bouton);c=c*(.35+.65*allume());
gl_FragColor=vec4(brume(c),1.);}`;

// La salle : écran géant, sa lumière retombe sur les murs et le sol.
const FS_SALLE = `${COMMUN}
uniform float yBas,largeurEcran,hauteurEcran,yEcran,zEcran,ouvert;uniform sampler2D tEcran;uniform vec2 cadreEcran;varying vec3 vN;
void main(){vec2 q=abs(vec2(vP.x,vP.y-yEcran))-vec2(largeurEcran,hauteurEcran)*.5;
float d=length(max(q,0.));float prof=abs(vP.z-zEcran);vec3 c;
if(vN.z<-.5){vec2 s=vec2(vP.x,vP.y-yEcran)/vec2(largeurEcran,hauteurEcran);c=d<=0.?texture2D(tEcran,s*cadreEcran+.5).rgb*.84*(.55+.45*exp(-dot(s,s)*1.6)):vec3(.008)+vec3(.12,.08,.06)*exp(-d*2.5);}
else{vec3 base=vN.y<-.5?vec3(.1,.02,.03):vec3(.09,.022,.03);
  c=base*(.14+.8*exp(-prof*.16))+vec3(.2,.15,.12)*exp(-prof*.3)*.25;}
gl_FragColor=vec4(c,1.);}`;

// Fauteuils : on voit leur dos, sombre ; seul le haut accroche la lumière de l'écran.
const FS_FAUTEUIL = `${COMMUN}
uniform float zEcran;varying vec3 vN;void main(){float l=exp(-abs(vP.z-zEcran)*.16);
vec3 c=vec3(.03,.006,.01)+vec3(.5,.34,.42)*pow(max(vN.y,0.),3.)*(.03+l*.42);gl_FragColor=vec4(c,1.);}`;

// Faisceaux des spots dans la brume.
const VS_FAISCEAU = 'varying vec3 vP;varying vec3 vN;varying float vH;void main(){vH=position.y+.5;vec4 m=modelMatrix*instanceMatrix*vec4(position,1.);vP=m.xyz;vN=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*m;}';
const FS_FAISCEAU = `${COMMUN}
varying vec3 vN;varying float vH;void main(){float bord=pow(abs(dot(normalize(vN),normalize(cameraPosition-vP))),2.2);
float a=bord*pow(vH,1.7)*mix(.13,.03,clair)*allume()*(1.-smoothstep(9.,34.,distance(vP,cameraPosition)));
gl_FragColor=vec4(vec3(1.,.84,.64)*a,1.);}`;

// Poussière en suspension.
const VS_POUSSIERE = 'uniform float echelle;varying vec3 vP;void main(){vP=position;vec4 v=viewMatrix*vec4(position,1.);gl_PointSize=echelle/-v.z;gl_Position=projectionMatrix*v;}';
const FS_POUSSIERE = `${COMMUN}
void main(){float a=smoothstep(.5,.0,length(gl_PointCoord-.5))*.45*allume()*(1.-smoothstep(5.,16.,distance(vP,cameraPosition)));
gl_FragColor=vec4(vec3(1.,.88,.72)*a*mix(1.,.2,clair),1.);}`;

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
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: true });
  } catch {
    return;
  }
  renderer.outputColorSpace = LinearSRGBColorSpace; // pixels bruts : les couleurs des affiches restent celles des fichiers

  const scene = new Scene();
  const cam = new PerspectiveCamera(FOV, 1, 0.1, 90);
  cam.rotation.order = 'YXZ';
  const camReflet = new PerspectiveCamera(FOV, 1, 0.1, 90);
  camReflet.rotation.order = 'YXZ';

  const commun = { fond: { value: new Vector3() }, accent: { value: new Vector3() }, clair: { value: 0 }, allumage: { value: 0 } };
  const matiere = (fragmentShader, uniforms = {}, options = {}) => new ShaderMaterial({ vertexShader: VS_MONDE, fragmentShader, uniforms: { ...commun, ...uniforms }, ...options });

  const plan = new PlaneGeometry(1, 1);
  const cube = new BoxGeometry(1, 1, 1);
  const uCouloir = { pas: { value: 1 }, demi: { value: 1 }, yAffiche: { value: 0 }, yBas: { value: -1 }, yHaut: { value: 1 }, zFin: { value: 0 }, ouvert: { value: 0 }, taille: { value: new Vector2(1, 1) } };
  const boite = new Mesh(cube, matiere(FS_COULOIR, uCouloir, { side: BackSide }));
  scene.add(boite);

  const rtReflet = new WebGLRenderTarget(4, 4);
  const uSol = { tReflet: { value: rtReflet.texture }, ecran: { value: new Vector2(1, 1) }, reflets: { value: 1 }, pas: uCouloir.pas, demi: uCouloir.demi, ouvert: uCouloir.ouvert, zFin: uCouloir.zFin };
  const sol = new Mesh(plan, matiere(FS_SOL, uSol));
  sol.rotation.x = -Math.PI / 2;
  scene.add(sol);

  // Portes : un pivot par battant.
  const portes = [1, -1].map((c) => {
    const pivot = new Group();
    const battant = new Mesh(cube, matiere(FS_PORTE));
    pivot.add(battant);
    scene.add(pivot);
    return { pivot, battant, c };
  });

  // La salle, derrière les portes.
  const uSalle = { tEcran: { value: null }, cadreEcran: { value: new Vector2(1, 1) }, yBas: uCouloir.yBas, largeurEcran: { value: 1 }, hauteurEcran: { value: 1 }, yEcran: { value: 0 }, zEcran: { value: 0 }, ouvert: uCouloir.ouvert };
  const salle = new Mesh(cube, matiere(FS_SALLE, uSalle, { side: BackSide }));
  scene.add(salle);
  // Dossier arrondi, de boîte unité comme le reste.
  const dossier = new Shape();
  dossier.moveTo(-0.5, -0.5);
  dossier.lineTo(0.5, -0.5);
  dossier.lineTo(0.5, 0.15);
  dossier.bezierCurveTo(0.5, 0.42, 0.3, 0.5, 0, 0.5);
  dossier.bezierCurveTo(-0.3, 0.5, -0.5, 0.42, -0.5, 0.15);
  dossier.closePath();
  const fauteuils = new InstancedMesh(new ExtrudeGeometry(dossier, { depth: 1, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -0.5), new ShaderMaterial({ vertexShader: VS_CAISSON, fragmentShader: FS_FAUTEUIL, uniforms: { ...commun, zEcran: uSalle.zEcran } }), 7 * 11);
  scene.add(fauteuils);
  fauteuils.frustumCulled = false;

  const uCaisson = new ShaderMaterial({ vertexShader: VS_CAISSON, fragmentShader: FS_CAISSON, uniforms: commun });
  const faisceaux = new InstancedMesh(new ConeGeometry(1, 1, 18, 1, true), new ShaderMaterial({
    vertexShader: VS_FAISCEAU, fragmentShader: FS_FAISCEAU, uniforms: commun, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }), 40);
  faisceaux.frustumCulled = false;
  scene.add(faisceaux);

  const uPoussiere = { echelle: { value: 30 } };
  const poussiere = new Points(new BufferGeometry(), new ShaderMaterial({
    vertexShader: VS_POUSSIERE, fragmentShader: FS_POUSSIERE, uniforms: { ...commun, ...uPoussiere }, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  poussiere.frustumCulled = false;
  scene.add(poussiere);

  let caissons = null;
  const cases = []; // { mesh, i, cote }
  let composer, bloom;
  let actif = false, boucle = 0, lisse = 0, vw = 1, vh = 1, haut = 0, course = 1, etroit = false, geo, debutAllumage = 0;
  let qualite = 2; // 2 : tout ; 1 : sans halos ni faisceaux ; 0 : sans reflets non plus
  const souris = { x: 0, y: 0, cx: 0, cy: 0 };

  const lireCouleur = (nom) => {
    canvas.style.color = `var(${nom})`;
    const v = getComputedStyle(canvas).color.match(/[\d.]+/g).slice(0, 3).map(Number);
    return Math.max(...v) > 1 ? v.map((x) => x / 255) : v;
  };
  const lireTheme = () => {
    commun.fond.value.fromArray(lireCouleur('--fond'));
    commun.accent.value.fromArray(lireCouleur('--accent'));
    commun.clair.value = html.dataset.salle === 'allumee' ? 1 : 0;
    if (bloom) { bloom.strength = commun.clair.value ? 0.08 : 0.5; bloom.threshold = commun.clair.value ? 0.98 : 0.9; }
  };

  const creerCase = (texture) => {
    const a = texture.image.width / texture.image.height;
    const cadre = a > 1 / RATIO ? new Vector2(1 / RATIO / a, 1) : new Vector2(1, a * RATIO);
    const mesh = new Mesh(plan, matiere(FS_AFFICHE, {
      carte: { value: texture }, cadre: { value: cadre }, taille: { value: new Vector2(1, 1) }, marge: { value: 0.035 },
    }));
    scene.add(mesh);
    return mesh;
  };

  const tailleRendu = () => {
    const ratio = Math.min(devicePixelRatio, etroit ? 1.5 : 2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(vw, vh, false);
    uSol.ecran.value.set(vw * ratio, vh * ratio);
    const f = etroit ? 0.3 : 0.5;
    rtReflet.setSize(Math.ceil(vw * ratio * f), Math.ceil(vh * ratio * f));
    composer?.setPixelRatio(ratio);
    composer?.setSize(vw, vh);
  };

  const mesurer = () => {
    vw = html.clientWidth;
    vh = scene3d.offsetHeight;
    haut = hautPage(couloir);
    course = Math.max(1, couloir.offsetHeight - vh);
    etroit = vw / vh < 5 / 4;
    tailleRendu();
    cam.aspect = camReflet.aspect = vw / vh;

    // À l'arrêt, l'affiche 3D tombe exactement sur la vraie carte : caméra à « recul » du plan de l'affiche, sans élan.
    const demi = etroit ? 1.3 : 2.2;
    const relief = 0.07; // saillie des caissons
    const xAffiche = demi - relief;
    const recul = xAffiche + 0.8;
    const parPx = (2 * recul * TAN) / vh;
    const visuel = cartes[0].querySelector('.carte-visuel');
    const l = visuel.offsetWidth * parPx, h = visuel.offsetHeight * parPx;
    const yCentre = visuel.offsetTop + visuel.offsetHeight / 2 + cartes[0].offsetTop + bloc.offsetTop;
    const yAffiche = (vh / 2 - yCentre) * parPx;
    const pas = l + Math.max(0.6, l * 0.42);
    const ecart = pas * CASES_PAR_ARRET;
    const zStop = (k) => -(k + 1) * ecart;
    const zFin = zStop(n - 2) - ecart;
    const profSalle = demi * 6;
    const zArret = (k) => (k >= n - 1 ? zFin - profSalle * 0.34 : zStop(k));
    geo = { demiLargeur: xAffiche, recul, zDepart: pas, zArret };

    const yBas = yAffiche - h / 2 - 0.45, yHaut = yAffiche + h / 2 + 0.55;
    const hauteur = yHaut - yBas;
    const zDebut = pas * 3;
    boite.position.set(0, (yBas + yHaut) / 2, (zDebut + zFin) / 2);
    boite.scale.set(demi * 2, hauteur, zDebut - zFin);
    uCouloir.pas.value = pas;
    uCouloir.demi.value = demi;
    uCouloir.yAffiche.value = yAffiche;
    uCouloir.yBas.value = yBas;
    uCouloir.yHaut.value = yHaut;
    uCouloir.zFin.value = zFin;
    uCouloir.taille.value.set(l, h);
    sol.position.set(0, yBas, (zDebut + zFin) / 2);
    sol.scale.set(demi * 2, zDebut - zFin, 1);

    // Affiches et caissons.
    const o = new Object3D();
    let nb = 0;
    for (const c of cases) {
      const visible = -c.i * pas > zFin + 0.7 * pas;
      const m = c.mesh;
      m.visible = visible;
      m.scale.set(l + 0.07, h + 0.07, 1);
      m.position.set(c.cote * xAffiche, yAffiche, -c.i * pas);
      m.rotation.y = -c.cote * Math.PI / 2;
      m.material.uniforms.taille.value.set(l, h);
      if (visible) {
        o.position.set(c.cote * (demi - relief / 2 + 0.008), yAffiche, -c.i * pas); // face avant juste derrière l'affiche
        o.rotation.set(0, 0, 0);
        o.scale.set(relief, h + 0.12, l + 0.12);
        o.updateMatrix();
        caissons.setMatrixAt(nb++, o.matrix);
      }
    }
    caissons.count = nb;
    caissons.instanceMatrix.needsUpdate = true;

    // Portes.
    const lPorte = demi * 0.72, hPorte = hauteur * 0.82;
    for (const p of portes) {
      p.pivot.position.set(p.c * lPorte, yBas + hPorte / 2, zFin);
      p.battant.scale.set(lPorte, hPorte, 0.05);
      p.battant.position.set(-p.c * lPorte / 2, 0, 0);
    }

    // Salle : plus large et plus haute que le couloir, écran bien en face de la caméra d'arrivée.
    const largeurSalle = demi * (etroit ? 2.6 : 3.6), hSalle = hauteur * 2.1;
    const zEcran = zFin - profSalle;
    salle.position.set(0, yBas + hSalle / 2, zFin - profSalle / 2);
    salle.scale.set(largeurSalle * 2, hSalle, profSalle);
    uSalle.zEcran.value = zEcran + 0.001;
    const hEcranMax = hSalle * 0.62;
    const lEcran = Math.min(largeurSalle * 1.6, hEcranMax * 1.85);
    uSalle.largeurEcran.value = lEcran;
    uSalle.hauteurEcran.value = Math.min(lEcran / 1.85, hEcranMax);
    uSalle.yEcran.value = yBas + hSalle * 0.18 + uSalle.hauteurEcran.value / 2;
    const aImg = uSalle.tEcran.value.image.width / uSalle.tEcran.value.image.height, aEcran = lEcran / uSalle.hauteurEcran.value;
    if (aImg > aEcran) uSalle.cadreEcran.value.set(aEcran / aImg, 1);
    else uSalle.cadreEcran.value.set(1, aImg / aEcran);

    // Rangées de fauteuils : devant la caméra, plus bas qu'elle.
    let f = 0;
    for (let r = 0; r < 7; r++) {
      for (let s = 0; s < 11; s++) {
        o.position.set((s - 5) * largeurSalle * 0.17, yBas + 0.22 + (6 - r) * 0.075, zArret(n - 1) - 2 - r * 0.62 * (profSalle / 13));
        o.rotation.set(0, 0, 0);
        o.scale.set(largeurSalle * 0.15, 0.56, 0.24);
        o.updateMatrix();
        fauteuils.setMatrixAt(f++, o.matrix);
      }
    }
    fauteuils.instanceMatrix.needsUpdate = true;

    // Faisceaux : un par spot du plafond.
    let b = 0;
    for (let i = 0; i < faisceaux.instanceMatrix.count - 1; i++) {
      const z = -(i - 1) * pas;
      if (z < zFin + pas * 0.5) break;
      o.position.set(0, (yBas + yHaut) / 2, z);
      o.scale.set(demi * 0.5, hauteur, demi * 0.5);
      o.updateMatrix();
      faisceaux.setMatrixAt(b++, o.matrix);
    }
    // Le projecteur : de la cabine au-dessus des portes, jusqu'à l'écran (pointe vers la caméra).
    const zCabine = zFin - 0.3, yCabine = yBas + hSalle * 0.9, longueur = zCabine - zEcran;
    o.position.set(0, (yCabine + uSalle.yEcran.value) / 2, (zCabine + zEcran) / 2);
    o.rotation.set(Math.PI / 2 + Math.atan2(yCabine - uSalle.yEcran.value, longueur), 0, 0);
    o.scale.set(lEcran * 0.5, Math.hypot(longueur, yCabine - uSalle.yEcran.value), uSalle.hauteurEcran.value * 0.5);
    o.updateMatrix();
    faisceaux.setMatrixAt(b++, o.matrix);
    o.rotation.set(0, 0, 0);
    faisceaux.count = b;
    faisceaux.instanceMatrix.needsUpdate = true;

    // Poussière : une seule fois, dans le volume du couloir.
    if (!poussiere.geometry.getAttribute('position')) {
      const nbP = etroit ? 110 : 280;
      const pos = new Float32Array(nbP * 3);
      for (let i = 0; i < nbP; i++) {
        pos[i * 3] = (Math.random() * 2 - 1) * demi * 0.9;
        pos[i * 3 + 1] = yBas + Math.random() * hauteur;
        pos[i * 3 + 2] = zDebut + Math.random() * (zFin - zDebut);
      }
      poussiere.geometry.setAttribute('position', new BufferAttribute(pos, 3));
    }
    uPoussiere.echelle.value = (vh / 900) * 26 * renderer.getPixelRatio();
    relancer();
  };

  const rendre = (decalX, decalY) => {
    if (qualite > 0) {
      // Reflet du sol : la même scène vue depuis sous le sol, image inversée à la lecture.
      const y0 = uCouloir.yBas.value;
      camReflet.fov = cam.fov;
      camReflet.position.set(cam.position.x, 2 * y0 - cam.position.y, cam.position.z);
      camReflet.rotation.set(-cam.rotation.x, cam.rotation.y, -cam.rotation.z);
      camReflet.setViewOffset(vw, vh, decalX, -decalY, vw, vh);
      sol.visible = faisceaux.visible = poussiere.visible = false;
      renderer.setRenderTarget(rtReflet);
      renderer.clear();
      renderer.render(scene, camReflet);
      renderer.setRenderTarget(null);
      sol.visible = true;
    }
    uSol.reflets.value = qualite > 0 ? 1 : 0;
    faisceaux.visible = poussiere.visible = qualite > 1;
    if (qualite > 1 && composer) composer.render();
    else renderer.render(scene, cam);
  };

  const dessiner = () => {
    const p = position(lisse, n);
    const ouverture = 1 - rampe(lisse, 0, AVANCE);
    const decalX = etroit ? 0 : -vw * 0.2 * ouverture;
    const decalY = etroit ? -vh * 0.22 * ouverture : 0;

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

    // Portes : s'ouvrent pendant la dernière marche.
    const ouvert = rampe(p, n - 2 + 0.1, n - 2 + 0.62);
    uCouloir.ouvert.value = ouvert;
    for (const q of portes) q.pivot.rotation.y = q.c * ouvert * 1.85;

    // Élan : la focale s'ouvre et la caméra penche un peu en marchant, puis tout revient exact à l'arrêt.
    const e = elan(p);
    const c = trajet(p, n, geo);
    const libre = 1 - present;
    cam.fov = FOV + e * 13;
    cam.setViewOffset(vw, vh, decalX, decalY, vw, vh);
    cam.position.set(c.x, souris.cy * libre * 0.25 + Math.sin(p * Math.PI * 2) * 0.03 * e, c.z);
    cam.rotation.set(souris.cy * libre * 0.12, c.yaw - souris.cx * libre * 0.25, Math.sin(p * Math.PI * 2) * 0.03 * e);
    rendre(decalX, decalY);
  };

  const cibleU = () => MathUtils.clamp((scrollY - haut) / course, 0, 1) * n;
  let derniere = performance.now(), lentes = 0, images = 0;
  const image = (t) => {
    const dt = Math.min((t - derniere) / 1000, 0.1);
    derniere = t;
    // Téléphone ou PC trop lent : on enlève des effets plutôt que de saccader.
    if (qualite > 0 && (document.visibilityState === 'visible')) {
      images++;
      if (dt > 0.034) lentes++;
      if (images >= 45) {
        if (lentes > 22) qualite--;
        images = lentes = 0;
      }
    }
    commun.allumage.value = debutAllumage ? Math.min(1, (t - debutAllumage) / DUREE_ALLUMAGE) : 1;
    const k = 1 - Math.pow(1 - 0.14, dt * 60);
    const cible = cibleU();
    lisse += (cible - lisse) * k;
    if (Math.abs(cible - lisse) < 0.0004) lisse = cible;
    souris.cx += (souris.x - souris.cx) * k;
    souris.cy += (souris.y - souris.cy) * k;
    if (Math.abs(souris.x - souris.cx) + Math.abs(souris.y - souris.cy) < 0.0005) { souris.cx = souris.x; souris.cy = souris.y; }
    dessiner();
    boucle = lisse !== cible || souris.cx !== souris.x || souris.cy !== souris.y || commun.allumage.value < 1 ? requestAnimationFrame(image) : 0;
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
      debutAllumage = debutAllumage || performance.now();
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
  const enHauteur = innerWidth / innerHeight < 5 / 4;
  // Écran en hauteur (téléphone) : moitié moins d'affiches différentes sur les murs, pour les données et la mémoire.
  const imagesMur = enHauteur ? donnees.mur.slice(0, 6) : donnees.mur;
  Promise.all([Promise.all(donnees.projets.map(charger)), Promise.all(imagesMur.map(charger))]).then(([projets, mur]) => {
    // Déjà loin dans la page (retour, rechargement) : on ne bouscule pas ce qu'il lit.
    // shortcut: l'accueil reste classique pour cette visite ; à revoir si le couloir est gardé.
    if (scrollY > innerHeight * 0.3 || !gabarit.matches) return;
    for (const t of [...projets, ...mur]) renderer.initTexture(t);
    // À l'écran de la salle : le visuel le plus large de la sélection.
    uSalle.tEcran.value = projets.reduce((m, t) => (t.image.width / t.image.height > m.image.width / m.image.height ? t : m));

    const dernier = (n + 1) * CASES_PAR_ARRET;
    let j = 0;
    for (let i = -2; i <= dernier; i++) {
      for (const cote of [1, -1]) {
        const k = i / CASES_PAR_ARRET - 1;
        const projet = Number.isInteger(k) && k >= 0 && k < cartes.length && coteArret(k) === cote ? projets[k] : null;
        cases.push({ i, cote, mesh: creerCase(projet ?? mur[j++ % mur.length]) });
      }
    }
    caissons = new InstancedMesh(cube, uCaisson, cases.length);
    caissons.frustumCulled = false;
    scene.add(caissons);

    // Halos : pas sur téléphone (trop coûteux), et avec un rendu antialiasé sur ordinateur.
    if (!enHauteur) {
      const rt = new WebGLRenderTarget(4, 4, { type: HalfFloatType, samples: 4 });
      composer = new EffectComposer(renderer, rt);
      composer.addPass(new RenderPass(scene, cam));
      bloom = new UnrealBloomPass(new Vector2(innerWidth / 2, innerHeight / 2), 0.5, 0.6, 0.9);
      composer.addPass(bloom);
    }

    if (!activer(true)) return;
    addEventListener('scroll', relancer, { passive: true });
    new ResizeObserver(() => { if (actif) mesurer(); }).observe(document.body);
    // Interrupteur « Lumières de la salle » : le couloir s'allume avec le site.
    new MutationObserver(() => { if (actif) { lireTheme(); relancer(); if (!boucle) dessiner(); } }).observe(html, { attributes: true, attributeFilter: ['data-salle', 'style'] });
    gabarit.addEventListener('change', (e) => activer(e.matches));
    relancer();
  }, () => {}); // image manquante : accueil classique
}

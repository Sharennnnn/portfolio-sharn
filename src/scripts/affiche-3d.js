// PROTOTYPE F2 — l'affiche de la page projet devient un plan 3D (Three.js) : légère inclinaison en
// perspective et reflet qui suivent la souris. Couleurs de l'affiche intactes (pas de tone mapping :
// le shader renvoie les pixels de l'image tels quels, seul le reflet s'y ajoute).
import { WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Mesh, TextureLoader, Vector2, MathUtils } from 'three';

const FOV = 30;
const MARGE = 0.08; // le canvas déborde de 8 % de chaque côté pour que l'inclinaison ne soit pas rognée

const VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const FS = `precision mediump float;
uniform sampler2D carte;uniform vec2 lumiere;uniform float intensite;varying vec2 vUv;
void main(){vec4 c=texture2D(carte,vUv);
float d=distance(vUv,lumiere);
float reflet=smoothstep(.55,0.,d)*intensite;
gl_FragColor=vec4(c.rgb+reflet*.22,c.a);}`;

export function lancerAffiche3d(img) {
  const lien = img.parentElement;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'affiche-3d';
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
  } catch {
    return; // pas de WebGL matériel : l'image reste
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  const uniforms = { carte: { value: null }, lumiere: { value: new Vector2(0.5, 0.5) }, intensite: { value: 0 } };
  const plan = new Mesh(new PlaneGeometry(1, 1), new ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms, transparent: true }));
  scene.add(plan);

  // Le canvas recouvre exactement l'image (plus la marge) ; le plan a la taille de l'image à l'écran.
  const placer = () => {
    const w = img.offsetWidth, h = img.offsetHeight;
    const mx = w * MARGE, my = h * MARGE;
    Object.assign(canvas.style, { left: `${img.offsetLeft - mx}px`, top: `${img.offsetTop - my}px`, width: `${w + 2 * mx}px`, height: `${h + 2 * my}px` });
    renderer.setSize(w + 2 * mx, h + 2 * my, false);
    camera.aspect = (w + 2 * mx) / (h + 2 * my);
    // Distance à laquelle un plan de hauteur h (en px) remplit h pixels du canvas.
    camera.position.z = (h + 2 * my) / 2 / Math.tan(MathUtils.degToRad(FOV / 2));
    camera.updateProjectionMatrix();
    plan.scale.set(w, h, 1);
    rendu();
  };

  const cible = { rx: 0, ry: 0, lx: 0.5, ly: 0.5, i: 0 };
  const etat = { ...cible };
  let boucle = 0, derniere = performance.now();
  const rendu = () => renderer.render(scene, camera);
  const image = (maintenant) => {
    const dt = Math.min((maintenant - derniere) / 1000, 0.1);
    derniere = maintenant;
    const k = 1 - Math.pow(1 - 0.12, dt * 60); // amortissement indépendant de la fréquence d'écran
    let reste = 0;
    for (const cle of Object.keys(cible)) {
      etat[cle] += (cible[cle] - etat[cle]) * k;
      reste += Math.abs(cible[cle] - etat[cle]);
    }
    plan.rotation.set(etat.rx, etat.ry, 0);
    uniforms.lumiere.value.set(etat.lx, etat.ly);
    uniforms.intensite.value = etat.i;
    rendu();
    boucle = reste > 0.0005 ? requestAnimationFrame(image) : 0;
  };
  const relancer = () => {
    if (!boucle) { derniere = performance.now(); boucle = requestAnimationFrame(image); }
  };

  lien.addEventListener('pointermove', (e) => {
    const r = img.getBoundingClientRect();
    const x = MathUtils.clamp((e.clientX - r.left) / r.width, 0, 1);
    const y = MathUtils.clamp((e.clientY - r.top) / r.height, 0, 1);
    cible.ry = (x - 0.5) * 0.22; // ~6° au plus
    cible.rx = (y - 0.5) * 0.18;
    cible.lx = x;
    cible.ly = 1 - y;
    cible.i = 1;
    relancer();
  });
  lien.addEventListener('pointerleave', () => {
    Object.assign(cible, { rx: 0, ry: 0, i: 0 });
    relancer();
  });

  new TextureLoader().load(img.currentSrc || img.src, (texture) => {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    uniforms.carte.value = texture;
    lien.append(canvas);
    new ResizeObserver(placer).observe(img);
    placer();
    lien.classList.add('en-3d'); // l'image devient invisible (elle reste pour le lien, l'accessibilité et la transition)
  });
}

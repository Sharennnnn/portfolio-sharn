// Fumée lente teintée de l'accent derrière le hero (WebGL brut, sans bibliothèque).
// Couche transparente (le grain reste visible) ; accent plafonné à 10 % : texte doux ≥ 4,7:1 calculé au pic (grain compris).
const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS = `precision mediump float;uniform vec2 r;uniform float t;uniform vec3 acc;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int k=0;k<5;k++){v+=a*n(p);p*=2.02;a*=.5;}return v;}
void main(){vec2 uv=gl_FragCoord.xy/r.y;float s=t*.03;
float f=fbm(uv*1.4+vec2(s,-s*.6)+fbm(uv*2.1-vec2(s*.8,s)));
float m=smoothstep(.45,1.05,f)*smoothstep(.15,.95,gl_FragCoord.x/r.x);
float a=m*.10;gl_FragColor=vec4(acc*a,a);}`;

function couleurAccent() {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().replace('#', '');
  const plein = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex.slice(0, 6);
  const v = parseInt(plein, 16);
  return Number.isNaN(v) ? [0.878, 0.604, 0.333] : [(v >> 16) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

export function lancerFumee(canvas) {
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return; // pas de WebGL : le fond noir reste

  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'r');
  const uT = gl.getUniformLocation(prog, 't');
  gl.uniform3fv(gl.getUniformLocation(prog, 'acc'), couleurAccent());

  // Tiers de résolution : la fumée est floue par nature (coût ÷ 9) ; le hero plein écran l'exige.
  const taille = () => {
    const d = Math.min(devicePixelRatio, 2) * 0.33;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * d));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * d));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const debut = performance.now();
  let visible = false;
  let boucle = 0;
  let derniere = 0;
  const image = (maintenant) => {
    // 30 images/s suffisent pour un mouvement aussi lent : on saute une image sur deux.
    if (maintenant - derniere < 30) {
      boucle = visible && !document.hidden ? requestAnimationFrame(image) : 0;
      return;
    }
    derniere = maintenant;
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, (performance.now() - debut) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    boucle = visible && !document.hidden ? requestAnimationFrame(image) : 0;
  };
  const relancer = () => { if (visible && !document.hidden && !boucle) boucle = requestAnimationFrame(image); };

  new ResizeObserver(taille).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; relancer(); }).observe(canvas);
  document.addEventListener('visibilitychange', relancer);
  taille();
  canvas.classList.add('active');
}

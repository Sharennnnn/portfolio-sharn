import test from 'node:test';
import assert from 'node:assert/strict';
import { AVANCE, position, presence, opaciteHero, opaciteEntete, milieuArret, camera, coteArret } from './couloir-temps.js';

const n = 5;
const g = { demiLargeur: 2.2, recul: 3, zDepart: 2, zArret: (k) => -(k + 1) * 8 };

test("la caméra part dans l'axe du couloir", () => {
  assert.deepEqual(camera(-1, n, g), { x: 0, z: 2, yaw: 0 });
});

test('à chaque arrêt, elle est exactement face à son affiche, à la bonne distance du mur', () => {
  for (let k = 0; k < n - 1; k++) {
    const c = camera(k, n, g);
    const cote = coteArret(k);
    assert.equal(c.z, g.zArret(k));
    assert.ok(Math.abs(cote * g.demiLargeur - c.x - cote * g.recul) < 1e-9);
    assert.ok(Math.abs(c.yaw + (cote * Math.PI) / 2) < 1e-9);
  }
});

test('elle reste dans le couloir et finit face aux portes, sans saut', () => {
  let avant = camera(-1, n, g);
  for (let p = -1; p <= n - 1 + 1e-9; p += 0.002) {
    const c = camera(Math.min(p, n - 1), n, g);
    assert.ok(Math.abs(c.x) < g.demiLargeur);
    assert.ok(Math.abs(c.z - avant.z) < 0.2 && Math.abs(c.yaw - avant.yaw) < 0.1, `p=${p}`);
    avant = c;
  }
  assert.deepEqual(camera(n - 1, n, g), { x: 0, z: g.zArret(n - 1), yaw: 0 });
});

test("la caméra part de l'entrée et finit au dernier arrêt, sans jamais reculer", () => {
  assert.equal(position(0, n), -1);
  assert.equal(position(n, n), n - 1);
  let avant = -Infinity;
  for (let u = 0; u <= n; u += 0.01) {
    const p = position(u, n);
    assert.ok(p >= avant - 1e-9);
    avant = p;
  }
});

test("la caméra est immobile pendant toute la présence d'un arrêt", () => {
  for (let k = 0; k < n; k++) {
    for (let u = k + AVANCE; u < k + 1; u += 0.02) {
      assert.equal(position(u, n), k);
      if (u < k + 0.97) assert.equal(presence(u, k, n), 1);
    }
  }
});

test('un seul arrêt est présent à la fois, et le dernier le reste', () => {
  for (let u = 0; u <= n; u += 0.01) {
    let actifs = 0;
    for (let k = 0; k < n; k++) if (presence(u, k, n) > 0) actifs++;
    assert.ok(actifs <= 1, `u=${u}`);
  }
  assert.equal(presence(n, n - 1, n), 1);
});

test("le hero a disparu avant le premier arrêt et l'en-tête ne le chevauche pas", () => {
  assert.equal(opaciteHero(0), 1);
  assert.equal(opaciteHero(AVANCE), 0);
  for (let u = 0; u < 1; u += 0.01) assert.ok(opaciteHero(u) === 0 || opaciteEntete(u) === 0, `u=${u}`);
});

test('le clavier est amené sur un arrêt pleinement visible', () => {
  for (let k = 0; k < n; k++) assert.equal(presence(milieuArret(k), k, n), 1);
});

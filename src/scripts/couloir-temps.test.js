import test from 'node:test';
import assert from 'node:assert/strict';
import { AVANCE, position, presence, opaciteHero, opaciteEntete, milieuArret } from './couloir-temps.js';

const n = 5;

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

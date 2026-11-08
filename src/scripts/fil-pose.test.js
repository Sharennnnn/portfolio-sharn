import test from 'node:test';
import assert from 'node:assert/strict';
import { calculerPose } from './fil-pose.js';

const m = {
  vw: 1440, vh: 900,
  mur: { x: 920, y: 450, l: 340, rz: -0.09 },
  pose: 1000, entree: 2000, entreeFin: 2360,
  rail: { x: 1260, y: 450, l: 240 },
  coin: 4200, coinFin: 4500, coinPose: { x: 1280, y: 200, l: 200 },
  sortie: 7200, sortieFin: 7425,
  fin: 7900, finPose: 8300,
  tours: [[0, 1000], [2000, 2360], [3200, 3400], [5500, 5800], [7900, 8300]],
};
const carte = { x: 870, y: 400, l: 320 };
const place = { x: 1250, y: 500, l: 240 };
const vivants = { carte: () => carte, case: () => place };
const pose = (s) => calculerPose(s, m, vivants);

test("part du mur et finit exactement sur la carte, à plat", () => {
  assert.deepEqual({ ...pose(0), ry: 0 }, { ...m.mur, ry: 0 });
  const presque = pose(999.999);
  assert.ok(Math.abs(presque.x - carte.x) < 0.01 && Math.abs(presque.l - carte.l) < 0.01);
  assert.ok(Math.abs(presque.ry - Math.PI) < 0.001);
});

test("disparaît quand la vraie carte ou le vide prend le relais", () => {
  for (const s of [1000, 1999, 7425, 7899]) assert.equal(pose(s), null);
});

test("entre et sort hors de l'écran, à droite", () => {
  assert.ok(pose(2000).x - pose(2000).l / 2 >= m.vw - 1);
  assert.ok(pose(7424.999).x - pose(7424.999).l / 2 >= m.vw - 1);
  assert.ok(pose(7900).x - pose(7900).l / 2 >= m.vw - 1);
});

test('reste dans sa colonne pendant les services et les outils', () => {
  for (let s = 2360; s <= 4200; s += 50) {
    const p = pose(s);
    assert.equal(p.x, m.rail.x);
    assert.equal(p.l, m.rail.l);
  }
});

test('finit à sa place, légèrement inclinée', () => {
  const p = pose(9000);
  assert.deepEqual([p.x, p.y, p.l, p.rz], [place.x, place.y, place.l, -0.07]);
  assert.ok(Math.abs(p.ry - 5 * Math.PI) < 1e-9);
});

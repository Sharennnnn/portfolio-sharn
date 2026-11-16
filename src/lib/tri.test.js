import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ordonner } from './tri.js';

const projets = [
  { rang: 0, titre: 'Creed', annee: 2026 },
  { rang: 1, titre: 'Urban Jersey', annee: 2025 },
  { rang: 2, titre: "L'Étrange Histoire de Mr. Anderson", annee: 2026 },
  { rang: 3, titre: 'Escape', annee: 2025 },
];
const titres = (liste) => liste.map((p) => p.titre);

test("par défaut : l'ordre de l'admin", () => {
  assert.deepEqual(titres(ordonner([...projets].reverse(), 'defaut', 'fr')), titres(projets));
});

test('A–Z : « É » rangé avec « E », sans tenir compte de la casse', () => {
  assert.deepEqual(titres(ordonner(projets, 'alpha', 'fr')), ['Creed', 'Escape', "L'Étrange Histoire de Mr. Anderson", 'Urban Jersey']);
});

test("date : du plus récent au plus ancien, l'ordre de l'admin départage la même année", () => {
  assert.deepEqual(titres(ordonner(projets, 'date', 'fr')), ['Creed', "L'Étrange Histoire de Mr. Anderson", 'Urban Jersey', 'Escape']);
});

test('la liste reçue reste intacte', () => {
  const copie = [...projets];
  ordonner(projets, 'alpha', 'fr');
  assert.deepEqual(projets, copie);
});

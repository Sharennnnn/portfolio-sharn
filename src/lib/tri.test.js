import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ordonner, cleDate } from './tri.js';

const projets = [
  { rang: 0, titre: 'Creed', date: '2026' },
  { rang: 1, titre: 'Urban Jersey', date: '2025' },
  { rang: 2, titre: "L'Étrange Histoire de Mr. Anderson", date: '2026-03-10' },
  { rang: 3, titre: 'Escape', date: '2025' },
  { rang: 4, titre: 'Sinners', date: '2026-09-01' },
];
const titres = (liste) => liste.map((p) => p.titre);

test("par défaut : l'ordre de l'admin", () => {
  assert.deepEqual(titres(ordonner([...projets].reverse(), 'defaut', 'fr')), titres(projets));
});

test('A–Z : « É » rangé avec « E », sans tenir compte de la casse', () => {
  assert.deepEqual(titres(ordonner(projets, 'alpha', 'fr')), ['Creed', 'Escape', "L'Étrange Histoire de Mr. Anderson", 'Sinners', 'Urban Jersey']);
});

test("date : plus récent d'abord, l'année seule après les dates de la même année, l'ordre de l'admin départage", () => {
  assert.deepEqual(titres(ordonner(projets, 'date', 'fr')), ['Sinners', "L'Étrange Histoire de Mr. Anderson", 'Creed', 'Urban Jersey', 'Escape']);
});

test('la liste reçue reste intacte', () => {
  const copie = [...projets];
  ordonner(projets, 'alpha', 'fr');
  assert.deepEqual(projets, copie);
});

test("cleDate : la date précise si elle existe, sinon l'année", () => {
  assert.equal(cleDate({ annee: 2026, date: new Date('2026-03-10') }), '2026-03-10');
  assert.equal(cleDate({ annee: 2025 }), '2025');
});

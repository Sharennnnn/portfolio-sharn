// Lancer : npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rempli, champ } from './utils.js';

test('« - », « — », « . » ou un champ vide masquent la rubrique', () => {
  for (const texte of ['', undefined, null, '-', '—', '.', ' — ', '\n']) assert.equal(rempli(texte), false, JSON.stringify(texte));
});

test('un vrai texte est affiché, même court', () => {
  for (const texte of ['Affiche publiée sur Instagram.', 'A3', '2026', 'É']) assert.equal(rempli(texte), true, texte);
});

test('champ : version anglaise si remplie, sinon le français', () => {
  const d = { contrainte: 'Le brief', contrainte_en: 'The brief', resultat: 'Publié', resultat_en: '' };
  assert.equal(champ(d, 'contrainte', 'en'), 'The brief');
  assert.equal(champ(d, 'contrainte', 'fr'), 'Le brief');
  assert.equal(champ(d, 'resultat', 'en'), 'Publié');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { sectionsAccueil } from './sections-accueil.js';

test("l'À propos suit la sélection, les références et l'index précèdent le contact", () => {
  assert.deepEqual(sectionsAccueil(['selection', 'services', 'cta']), ['bandeau', 'selection', 'apropos', 'services', 'methode', 'realise', 'index', 'cta']);
});

test("l'ordre choisi dans l'admin est gardé", () => {
  assert.deepEqual(sectionsAccueil(['services', 'selection', 'parcours', 'cta']), ['bandeau', 'services', 'methode', 'selection', 'apropos', 'parcours', 'realise', 'index', 'cta']);
});

test('sans sélection ni contact visibles, rien ne disparaît', () => {
  assert.deepEqual(sectionsAccueil(['services']), ['bandeau', 'apropos', 'services', 'methode', 'realise', 'index']);
});

test('sans services, la méthode se place avant les références', () => {
  assert.deepEqual(sectionsAccueil(['selection', 'cta']), ['bandeau', 'selection', 'apropos', 'methode', 'realise', 'index', 'cta']);
});

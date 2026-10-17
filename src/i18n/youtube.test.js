// Lancer : npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { idYoutube } from './youtube.js';

test('reconnaît les formats de lien YouTube courants', () => {
  const id = 'cUqlplrckp4';
  for (const lien of [
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abc123`,
    `https://www.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/watch?si=abc123&v=${id}`,
    `https://m.youtube.com/watch?v=${id}&t=12s`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/live/${id}`,
  ]) assert.equal(idYoutube(lien), id, lien);
});

test('refuse le reste', () => {
  for (const lien of ['', undefined, 'https://vimeo.com/123456789', 'https://www.youtube.com/@chaine', 'cUqlplrckp4']) {
    assert.equal(idYoutube(lien), null, String(lien));
  }
});

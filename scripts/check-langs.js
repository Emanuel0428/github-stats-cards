// Comprobación de cómo se miden los lenguajes: en cuántos repos se usan
// (tallyLanguages) y qué porcentaje se pinta (langShares, parte del total y no
// del lenguaje más usado).
import assert from 'node:assert/strict';
import { langShares } from '../src/cards/layout.js';
import { tallyLanguages } from '../src/utils/github.js';

const langs = [
  { language: 'TypeScript', count: 600 },
  { language: 'JavaScript', count: 200 },
  { language: 'Python', count: 200 },
];

const all = langShares(langs, 3);
assert.deepEqual(all.map((l) => Math.round(l.percentage)), [60, 20, 20]);
assert.ok(Math.abs(all.reduce((s, l) => s + l.percentage, 0) - 100) < 1e-9, 'suman 100');
assert.equal(all[0].barWidth, 240, 'el mayor llena la barra');
assert.equal(all[1].barWidth, 80);

// Recortar filas no cambia el porcentaje: siguen siendo parte del total.
const cut = langShares(langs, 2);
assert.equal(cut.length, 2);
assert.deepEqual(cut.map((l) => Math.round(l.percentage)), [60, 20]);

assert.deepEqual(langShares([], 5), []);

// tallyLanguages: un repo enorme no vale más que un repo; cuenta presencia.
const repos = [
  { TypeScript: 500000, CSS: 1000 },   // CSS < 5% del repo: no cuenta
  { Python: 1000, TypeScript: 500 },
  { Python: 800 },
];
assert.deepEqual(tallyLanguages(repos), [
  { language: 'TypeScript', count: 2 },
  { language: 'Python', count: 2 },
]);
assert.equal(tallyLanguages(repos, 1).length, 1);
assert.deepEqual(tallyLanguages([{}]), []);
assert.deepEqual(tallyLanguages([]), []);

console.log('check-langs: ok');

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// La landing es un solo archivo con su CSS y su JS dentro, y el script toca los
// elementos por id. Mover markup y dejar un getElementById colgando no rompe
// nada al cargar: rompe al primer clic, en silencio. Esto lo caza antes.

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'src', 'public', 'index.html');

let checks = 0;
function ok(label) {
  checks++;
  console.log(`  ✓ ${label}`);
}

const html = await fs.readFile(FILE, 'utf8');

// Los <script type="application/ld+json"> son datos, no código: fuera.
const scripts = [...html.matchAll(/<script(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .filter((s) => s.trim());

console.log('\nEl script de la página');
assert.equal(scripts.length, 1, `se esperaba 1 script inline, hay ${scripts.length}`);
const js = scripts[0];
new Function(js); // lanza si no parsea
ok(`parsea (${js.split('\n').length} líneas)`);

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

const referenced = [...js.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
assert.ok(referenced.length > 15, 'se esperaban bastantes getElementById; ¿cambió el patrón?');
for (const id of referenced) {
  assert.ok(ids.has(id), `el script usa getElementById('${id}') y ese id no existe en el HTML`);
}
ok(`los ${new Set(referenced).size} ids que usa el script existen en el markup`);

for (const sel of [...js.matchAll(/querySelector\('\.([\w-]+)'\)/g)].map((m) => m[1])) {
  assert.ok(html.includes(`class="${sel}"`), `querySelector('.${sel}') no encuentra nada en el HTML`);
}
ok('los selectores de clase del script apuntan a algo');

// Los onclick del HTML llaman a funciones que tienen que existir.
const handlers = new Set([...html.matchAll(/on(?:click|input)="(?:event\.stopPropagation\(\);\s*)?(\w+)\(/g)].map((m) => m[1]));
for (const fn of handlers) {
  if (fn === 'document') continue;
  assert.match(js, new RegExp(`function ${fn}\\b`), `hay un onclick que llama a ${fn}() y no está definida`);
}
ok(`las ${handlers.size} funciones llamadas desde onclick están definidas`);

console.log('\nEl SEO que no se debe tocar');
assert.match(html, /<title>[^<]{20,}<\/title>/, 'falta el title');
assert.match(html, /<meta name="description" content="[^"]{50,}"/, 'falta la meta description');
assert.match(html, /rel="canonical"/, 'falta el canonical');
assert.equal((html.match(/schema\.org\/FAQPage/g) || []).length, 1);
assert.equal((html.match(/schema\.org\/Question/g) || []).length, 6, 'deberían seguir siendo 6 preguntas');
assert.equal((html.match(/itemprop="acceptedAnswer"/g) || []).length, 6);
assert.equal((html.match(/application\/ld\+json/g) || []).length, 3, 'los 3 bloques JSON-LD siguen ahí');
for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
  JSON.parse(block[1]);
}
ok('title, description, canonical, los 3 JSON-LD y las 6 preguntas con schema siguen intactos');

assert.equal((html.match(/<h1[^>]*>/g) || []).length, 1, 'debe haber exactamente un h1');
ok('un solo h1');

console.log('\nLo que se quitó no vuelve');
for (const [what, re] of [
  ['la línea de keywords del footer', /Keywords:\s*github stats/i],
  ['el enlace a /docs, que es un 404', /href="\/docs"/],
  ['el enlace a /faq, que es un 404', /href="\/faq"/],
  ['el enlace a /examples, que es un 404', /href="\/examples"/],
  ['la sección "Why Choose"', /Why Choose GitHub Stats Cards/i]
]) {
  assert.doesNotMatch(html, re, `volvió ${what}`);
}
ok('sin keyword stuffing ni enlaces rotos en el footer');

// Guarda contra que el texto se vuelva a acumular. Se mide lo que se lee al
// entrar: el panel de opciones y las respuestas de la FAQ están detrás de un
// clic, así que no cuentan (sus títulos y el summary sí).
function cut(text, from, to) {
  const a = text.indexOf(from);
  if (a === -1) return text;
  const b = text.indexOf(to, a);
  assert.notEqual(b, -1, `no encuentro el final de "${from}"; ¿cambió la estructura?`);
  return text.slice(0, a) + text.slice(b);
}

let body = html.slice(html.indexOf('<body'));
body = cut(body, '<div id="advanced-options"', '<div id="error-container">');
body = body.replace(/<\/summary>[\s\S]*?<\/details>/g, '</summary>');

const words = body
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .split(' ')
  .filter(Boolean).length;

assert.ok(words < 220, `el texto de entrada se está acumulando otra vez: ${words} palabras (antes 736, límite 220)`);
ok(`texto que se lee al entrar: ${words} palabras (antes 736)`);

console.log('\nLa estructura nueva');
for (const [what, needle] of [
  ['el marco de README alrededor de las tarjetas', 'class="readme-tab"'],
  ['el bloque con el markdown a la vista', 'id="md-snippet"'],
  ['la galería de temas', 'id="themes-grid"'],
  ['la FAQ plegable', '<details>'],
  ['el aviso de que se está viendo una demo', 'id="demo-note"']
]) {
  assert.ok(html.includes(needle), `falta ${what}`);
}
ok('README mock, snippet, galería, acordeón y aviso de demo presentes');

assert.match(html, /@media \(prefers-reduced-motion: reduce\)/, 'la página anima casi todo y debe respetar reduce-motion');
assert.match(html, /:focus-visible/, 'hace falta foco visible con teclado');
ok('respeta prefers-reduced-motion y tiene foco de teclado visible');

console.log(`\n${checks} comprobaciones OK\n`);

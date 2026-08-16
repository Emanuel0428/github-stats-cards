import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  background, fetchImageDataUri, isPrivateIp,
  parseBg, readPresetDataUri, PRESET_NAMES, PRESET_DIR
} from '../src/cards/background.js';
import { getStatsCard } from '../src/cards/stats-cyberpunk.js';
import { getTopLanguagesCard } from '../src/cards/topLanguages-cyberpunk.js';
import { getStatsBrutalistCard } from '../src/cards/stats-brutalist.js';
import { getTopLanguagesBrutalistCard } from '../src/cards/topLanguages-brutalist.js';
import { getStatsTerminalCard } from '../src/cards/stats-terminal.js';
import { getTopLanguagesTerminalCard } from '../src/cards/topLanguages-terminal.js';
import { getStatsLuxuryCard } from '../src/cards/stats-luxury.js';
import { getTopLanguagesLuxuryCard } from '../src/cards/topLanguages-luxury.js';
import { getStatsVaporwaveCard } from '../src/cards/stats-vaporwave.js';
import { getTopLanguagesVaporwaveCard } from '../src/cards/topLanguages-vaporwave.js';

// Verificación de los fondos de tarjeta: guardas del parámetro ?bg, capa
// animada por tema y que las 10 tarjetas siguen generando SVG válido.
// No toca la red: las URLs privadas se resuelven por literal IP o /etc/hosts.

const THEMES = ['cyberpunk', 'terminal', 'luxury', 'vaporwave', 'brutalist'];

const FAKE_STATS = {
  stars: 120, commits: 3400, prs: 42, issues: 17, contributedTo: 8,
  streaks: { current: 5, longest: 31 }
};

const FAKE_LANGS = [
  { language: 'JavaScript', count: 40 },
  { language: 'TypeScript', count: 25 },
  { language: 'Python', count: 10 }
];

const CARDS = [
  ['stats-cyberpunk', (o) => getStatsCard('u', FAKE_STATS, o)],
  ['stats-brutalist', (o) => getStatsBrutalistCard('u', FAKE_STATS, o)],
  ['stats-terminal', (o) => getStatsTerminalCard('u', FAKE_STATS, o)],
  ['stats-luxury', (o) => getStatsLuxuryCard('u', FAKE_STATS, o)],
  ['stats-vaporwave', (o) => getStatsVaporwaveCard('u', FAKE_STATS, o)],
  ['lang-cyberpunk', (o) => getTopLanguagesCard('u', FAKE_LANGS, o)],
  ['lang-brutalist', (o) => getTopLanguagesBrutalistCard('u', FAKE_LANGS, o)],
  ['lang-terminal', (o) => getTopLanguagesTerminalCard('u', FAKE_LANGS, o)],
  ['lang-luxury', (o) => getTopLanguagesLuxuryCard('u', FAKE_LANGS, o)],
  ['lang-vaporwave', (o) => getTopLanguagesVaporwaveCard('u', FAKE_LANGS, o)]
];

let checks = 0;
function ok(label) {
  checks++;
  console.log(`  ✓ ${label}`);
}

async function rejects(label, fn) {
  await assert.rejects(fn, `debería rechazar: ${label}`);
  ok(label);
}

async function main() {
  console.log('\nGuarda SSRF (isPrivateIp)');
  for (const ip of [
    '127.0.0.1', '10.0.0.1', '192.168.1.1', '172.16.0.1', '172.31.255.255',
    '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1',
    '::1', '::', 'fc00::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1'
  ]) {
    assert.equal(isPrivateIp(ip), true, `${ip} debería considerarse privada`);
  }
  ok('rechaza loopback, privadas, link-local, CGNAT, multicast e IPv4-mapped');

  for (const ip of ['8.8.8.8', '140.82.121.4', '2606:4700:4700::1111', '::ffff:8.8.8.8']) {
    assert.equal(isPrivateIp(ip), false, `${ip} debería considerarse pública`);
  }
  ok('acepta IPs públicas (v4, v6 y v4-mapped pública)');

  assert.equal(isPrivateIp('no-es-una-ip'), true);
  ok('lo que no parsea como IP se rechaza');

  console.log('\nGuardas de fetchImageDataUri');
  await rejects('esquema no http(s)', () => fetchImageDataUri('ftp://example.com/a.png'));
  await rejects('URL malformada', () => fetchImageDataUri('no-una-url'));
  await rejects('IP loopback literal', () => fetchImageDataUri('http://127.0.0.1:9/a.png'));
  await rejects('metadata de la nube', () => fetchImageDataUri('http://169.254.169.254/latest/meta-data'));
  await rejects('rango privado literal', () => fetchImageDataUri('https://10.0.0.1/a.png'));

  console.log('\nParser de ?bg');
  assert.deepEqual(parseBg('#0d1117'), { kind: 'solid', color: '#0d1117' });
  assert.deepEqual(parseBg('0d1117'), { kind: 'solid', color: '#0d1117' });
  assert.deepEqual(parseBg('  f0f  '), { kind: 'solid', color: '#f0f' });
  ok('color sólido, con y sin # (el # crudo en una URL nunca llega al servidor)');

  assert.deepEqual(parseBg('linear:#ff71ce,#01cdfe'), {
    kind: 'linear', colors: ['#ff71ce', '#01cdfe'], angle: 135
  });
  assert.deepEqual(parseBg('linear:ff71ce,01cdfe:90'), {
    kind: 'linear', colors: ['#ff71ce', '#01cdfe'], angle: 90
  });
  assert.deepEqual(parseBg('radial:#000,#fff'), {
    kind: 'radial', colors: ['#000', '#fff'], angle: 135
  });
  ok('gradientes con ángulo opcional');

  for (const name of PRESET_NAMES) {
    assert.deepEqual(parseBg(name), { kind: 'preset', name });
  }
  ok(`los ${PRESET_NAMES.length} presets generados se reconocen por nombre`);

  assert.deepEqual(parseBg('preset:mi-loop'), { kind: 'file', name: 'mi-loop' });
  assert.deepEqual(parseBg('https://ok.dev/a.gif'), { kind: 'remote', url: 'https://ok.dev/a.gif' });
  ok('preset alojado y URL remota');

  for (const bad of [
    '', '   ', undefined, null, 'no-existe-este-preset', 'linear:#fff',
    'linear:#zzz,#fff', 'linear:#111,#222,#333,#444,#555,#666',
    'preset:../../etc/passwd', 'preset:a/b', 'preset:.env', 'javascript:alert(1)'
  ]) {
    assert.equal(parseBg(bad), null, `parseBg(${JSON.stringify(bad)}) debería ser null`);
  }
  ok('rechaza vacíos, colores inválidos, y nombres de preset con ruta');

  await rejects('preset con traversal en readPresetDataUri', () => readPresetDataUri('../../package'));
  await rejects('preset inexistente', () => readPresetDataUri('no-existe-de-verdad'));

  // Un archivo de verdad en el directorio de presets: es el único camino que
  // toca el disco, y el que se rompería en silencio si cambiara la ruta.
  const tmpName = 'checktmpbg0';
  const tmpFile = path.join(PRESET_DIR, `${tmpName}.png`);
  const PNG_1PX = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  await fs.writeFile(tmpFile, PNG_1PX);
  try {
    const uri = await readPresetDataUri(tmpName);
    assert.match(uri, /^data:image\/png;base64,/);
    const card = await background('luxury', {
      width: 520, height: 340, motion: false, bg: `preset:${tmpName}`, fit: 'contain', pos: 'top', blur: 5, gray: true
    });
    assert.match(card.defs, /<filter id="bgxFx"[^>]*>.*feColorMatrix.*feGaussianBlur/s);
    assert.match(card.layers, /preserveAspectRatio="xMidYMin meet"/);
    assert.match(card.layers, /filter="url\(#bgxFx\)"/);
    assert.match(card.layers, /x="-15" y="-15"/, 'el blur debe dibujarse fuera del borde');
    assert.match(card.layers, /opacity="0\.65"/, 'una imagen lleva velo por defecto');
    ok('preset alojado: se lee de disco, con fit, posición, blur, grises y velo');
  } finally {
    await fs.unlink(tmpFile);
  }

  console.log('\nFondos sin URL');
  const solid = await background('cyberpunk', { width: 520, height: 340, motion: false, bg: '0d1117' });
  assert.match(solid.layers, /fill="#0d1117"/);
  assert.doesNotMatch(solid.layers, /opacity="0\.65"/, 'un color elegido a propósito no lleva velo');
  ok('color sólido, sin velo por defecto');

  const grad = await background('vaporwave', {
    width: 520, height: 340, motion: false, bg: 'linear:ff71ce,01cdfe:90'
  });
  assert.match(grad.defs, /<linearGradient id="bgxFill"/);
  assert.match(grad.defs, /rotate\(0 0\.5 0\.5\)/, '90° en CSS = rotación 0 sobre un gradiente horizontal');
  assert.match(grad.layers, /fill="url\(#bgxFill\)"/);
  ok('gradiente: def + rect que lo usa');

  const mesh = await background('luxury', { width: 520, height: 340, motion: false, bg: 'mesh-neon' });
  for (const ref of mesh.layers.matchAll(/url\(#([\w-]+)\)/g)) {
    assert.ok(mesh.defs.includes(`id="${ref[1]}"`), `preset: url(#${ref[1]}) sin def`);
  }
  ok('preset generado: todo url(#id) tiene su def');

  const veiled = await background('terminal', {
    width: 520, height: 340, motion: false, bg: '#123456', scrim: '40', scrimColor: 'ff0000'
  });
  assert.match(veiled.layers, /fill="#ff0000" opacity="0\.4"/);
  ok('scrim y scrimColor explícitos también sobre un color');

  const clamped = await background('terminal', {
    width: 520, height: 340, motion: false, bg: '#123456', scrim: '9999'
  });
  assert.match(clamped.layers, /opacity="1"/, 'scrim fuera de rango debe acotarse');
  ok('los números fuera de rango se acotan en vez de romper');

  console.log('\nCapa animada por tema');
  for (const theme of THEMES) {
    const { defs, layers } = await background(theme, { width: 520, height: 340 });
    assert.ok(defs.length > 0, `${theme}: defs vacío`);
    assert.ok(layers.length > 0, `${theme}: layers vacío`);
    assert.match(defs, /animation:/, `${theme}: sin animación`);
    assert.match(defs, /prefers-reduced-motion/, `${theme}: sin respeto por reduced-motion`);
    assert.match(defs, /bgx/, `${theme}: ids sin prefijar, pueden colisionar`);
  }
  ok(`los ${THEMES.length} temas animan y respetan prefers-reduced-motion`);

  for (const theme of THEMES) {
    const off = await background(theme, { width: 520, height: 340, motion: false });
    assert.equal(off.defs, '', `${theme}: motion:false sigue emitiendo defs`);
    assert.equal(off.layers, '', `${theme}: motion:false sigue emitiendo layers`);
  }
  ok('motion:false no emite nada');

  console.log('\nFail-open del parámetro bg');
  const bad = await background('cyberpunk', {
    width: 520, height: 340, motion: false, bg: 'http://127.0.0.1:9/roto.png'
  });
  assert.equal(bad.layers, '', 'un bg inválido no debe dejar rastro en el SVG');
  ok('un bg inválido cae al fondo del tema sin lanzar');

  console.log('\nLas 10 tarjetas siguen generando SVG');
  for (const [name, render] of CARDS) {
    for (const opts of [
      { motion: true },
      { motion: false },
      { motion: true, bg: 'mesh-neon' },
      { motion: false, bg: 'linear:ff71ce,01cdfe:200', scrim: '30' }
    ]) {
      const svg = (await render(opts)).trim();
      const suffix = `${name} (${JSON.stringify(opts)})`;
      assert.ok(svg.startsWith('<svg'), `${suffix}: no empieza en <svg>`);
      assert.ok(svg.endsWith('</svg>'), `${suffix}: no termina en </svg>`);
      assert.ok(!svg.includes('undefined'), `${suffix}: hay un 'undefined' interpolado`);
      assert.ok(!svg.includes('[object'), `${suffix}: hay un objeto interpolado`);
      assert.equal(
        (svg.match(/<defs>/g) || []).length,
        (svg.match(/<\/defs>/g) || []).length,
        `${suffix}: <defs> descuadrado`
      );
      // Los ids referenciados con url(#x) tienen que existir en el documento.
      for (const ref of svg.matchAll(/url\(#([\w-]+)\)/g)) {
        assert.ok(
          svg.includes(`id="${ref[1]}"`),
          `${suffix}: url(#${ref[1]}) no apunta a ningún id`
        );
      }
    }
    ok(name);
  }

  console.log(`\n${checks} comprobaciones OK\n`);
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
});

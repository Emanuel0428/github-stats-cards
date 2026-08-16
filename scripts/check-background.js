import assert from 'node:assert/strict';
import { background, fetchImageDataUri, isPrivateIp } from '../src/cards/background.js';
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
    for (const opts of [{ motion: true }, { motion: false }]) {
      const svg = (await render(opts)).trim();
      const suffix = `${name} (motion=${opts.motion})`;
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

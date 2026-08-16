// Los colores de cada tema están escritos dentro del <style> de su tarjeta.
// Este módulo devuelve un segundo bloque CSS con los mismos selectores: misma
// especificidad, va detrás, gana. Retocar un tema no obliga a duplicarlo ni a
// tocar las 10 tarjetas, porque todas interpolan estos defs justo después de
// su propio <style>.

export function normalizeColor(raw) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(raw ?? '').trim());
  return m ? `#${m[1]}` : null;
}

export function clampNum(raw, lo, hi, dflt) {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
}

// Rol visual -> selectores. Los nombres de clase ya son comunes a las 10
// tarjetas; lo único que cambia entre temas es el color con el que vienen.
const ROLES = {
  titleColor: { fill: ['.title'] },
  textColor: { fill: ['.stat-value', '.rank-text', '.lang-name'] },
  mutedColor: { fill: ['.stat-label', '.lang-percent', '.terminal-bar'] },
  // Los iconos llevan el color como atributo de presentación, que cualquier
  // regla CSS pisa. En las tarjetas de stats, un <g transform> es un icono.
  iconColor: { fill: ['g[transform] path'] },
  accentColor: {
    fill: ['.luxury-corner', '.data-dot', '.cursor', '.terminal-prompt', '.rank-blob'],
    stroke: ['.accent-line', '.heavy-border', '.rank-box', '.rank-ring', '.luxury-border', '.corner-accent']
  }
};

// El halo va detrás del texto, no de las líneas ni de las barras.
const TEXT = [
  '.title', '.stat-label', '.stat-value', '.rank-text',
  '.lang-name', '.lang-percent', '.terminal-prompt', '.terminal-bar'
];

/**
 * CSS que pisa los colores del tema. Todo es opcional: sin parámetros no
 * emite nada y la tarjeta queda exactamente como estaba.
 *
 * @param {object} opts
 * @param {string} [opts.titleColor]
 * @param {string} [opts.textColor]   valores, rank y nombres de lenguaje
 * @param {string} [opts.mutedColor]  etiquetas y porcentajes
 * @param {string} [opts.accentColor] líneas, bordes, marcos y puntos
 * @param {string} [opts.iconColor]
 * @param {string} [opts.halo]        hex, u `on` para el color del tema
 * @param {number} [opts.haloWidth]   0-12, por defecto 4
 * @param {string} haloDefault        color de halo del tema (= color del velo)
 * @returns {string} bloque <style> o cadena vacía
 */
export function palette(opts = {}, haloDefault = '#000000') {
  const rules = [];

  for (const [key, sel] of Object.entries(ROLES)) {
    const color = normalizeColor(opts[key]);
    if (!color) continue;
    if (sel.fill) rules.push(`${sel.fill.join(', ')} { fill: ${color}; }`);
    if (sel.stroke) rules.push(`${sel.stroke.join(', ')} { stroke: ${color}; }`);
  }

  // Sobre una foto no hay color de texto que se lea entero; el contorno sí.
  // Es la alternativa al velo cuando el fondo tiene que verse nítido.
  const on = opts.halo === true || /^(on|1|true)$/i.test(String(opts.halo ?? ''));
  const halo = on ? (normalizeColor(haloDefault) || '#000000') : normalizeColor(opts.halo);
  if (halo) {
    const width = clampNum(opts.haloWidth, 0, 12, 4);
    rules.push(
      `${TEXT.join(', ')} { paint-order: stroke; stroke: ${halo}; ` +
      `stroke-width: ${width}px; stroke-linejoin: round; stroke-opacity: 0.85; }`
    );
  }

  if (!rules.length) return '';
  return `\n      <style>\n        ${rules.join('\n        ')}\n      </style>`;
}

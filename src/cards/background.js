import dns from 'node:dns/promises';
import net from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';

// Las tarjetas se sirven como SVG dentro de un <img> (proxy camo de GitHub):
// no hay JS, ni fetch del navegador, ni <video>. El único movimiento que
// sobrevive ahí es CSS/SMIL declarativo dentro del propio SVG, y la única forma
// de meter una imagen del usuario es que el servidor la descargue y la inlinee
// en base64. Este módulo hace las dos cosas.

// 2 MB de imagen son ~2.7 MB de base64 dentro del SVG. Por encima de eso camo
// empieza a tardar o a rendirse, así que este es el techo útil, no un límite
// arbitrario.
const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 5000;

// Solo raster: un SVG remoto inlineado sería un documento ajeno dentro del
// nuestro, y no hay razón para aceptar ese riesgo por un fondo.
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const EXT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

export const PRESET_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', 'public', 'backgrounds'
);

// Color del velo que va sobre la imagen del usuario para que el texto de la
// tarjeta siga siendo legible. Brutalist es el único con fondo claro.
const SCRIM = {
  cyberpunk: '#0a0e27',
  terminal: '#0c0c0c',
  luxury: '#1a1a1a',
  vaporwave: '#241b3d',
  brutalist: '#ffffff'
};

// Fondos generados: no hay archivo detrás, se dibujan en SVG. `blobs` son
// manchas radiales [color, cx%, cy%, r%] sobre `base`.
const PRESETS = {
  'mesh-neon': { base: '#0a0e27', blobs: [['#00f5ff', 15, 20, 70], ['#bd00ff', 85, 30, 65], ['#ff006e', 50, 95, 60]] },
  'mesh-sunset': { base: '#1a0b2e', blobs: [['#ff71ce', 20, 15, 70], ['#ffb86c', 80, 25, 60], ['#01cdfe', 55, 100, 65]] },
  'mesh-mint': { base: '#04231d', blobs: [['#00ff9d', 20, 25, 70], ['#00b3ff', 80, 20, 60], ['#0aff99', 50, 100, 55]] },
  'mesh-ember': { base: '#1c0a00', blobs: [['#ff6b00', 25, 20, 70], ['#ffcc00', 80, 35, 55], ['#ff1e56', 50, 95, 60]] },
  'grid-dark': { base: '#0d1117', grid: { size: 32, color: '#30363d' } },
  'grid-light': { base: '#f6f8fa', grid: { size: 32, color: '#d0d7de' } },
  'dots-dark': { base: '#0d1117', dots: { size: 18, color: '#30363d' } }
};

export const PRESET_NAMES = Object.keys(PRESETS);

// ---------------------------------------------------------------- parámetros

function normalizeColor(raw) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(raw).trim());
  return m ? `#${m[1]}` : null;
}

function clampNum(raw, lo, hi, dflt) {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
}

/**
 * `?bg=` no es solo una URL. Un único parámetro con dispatch por forma:
 *
 *   #0d1117 | 0d1117                  -> color sólido
 *   linear:#ff71ce,#01cdfe[:135]      -> gradiente (ángulo CSS, opcional)
 *   radial:#ff71ce,#01cdfe            -> gradiente radial
 *   mesh-neon | grid-dark | ...       -> preset generado, sin archivo
 *   preset:mi-loop                    -> archivo de src/public/backgrounds/
 *   https://.../loop.gif              -> imagen o GIF remoto
 *
 * Devuelve null si no se reconoce: quien llame cae al fondo del tema.
 */
export function parseBg(raw) {
  const v = String(raw ?? '').trim();
  if (!v) return null;

  if (/^https?:\/\//i.test(v)) return { kind: 'remote', url: v };

  if (/^preset:/i.test(v)) {
    const name = v.slice(7).trim();
    // El nombre acaba en una ruta de disco: nada de barras, puntos ni `..`.
    return /^[a-z0-9][a-z0-9_-]*$/i.test(name) ? { kind: 'file', name } : null;
  }

  const grad = /^(linear|radial):(.+)$/i.exec(v);
  if (grad) {
    const parts = grad[2].split(':');
    const angle = parts.length > 1 ? clampNum(parts.pop(), 0, 360, 135) : 135;
    const colors = parts.join(':').split(',').map(normalizeColor);
    if (colors.length < 2 || colors.length > 5 || colors.some((c) => !c)) return null;
    return { kind: grad[1].toLowerCase(), colors, angle };
  }

  const preset = PRESETS[v.toLowerCase()];
  if (preset) return { kind: 'preset', name: v.toLowerCase() };

  const solid = normalizeColor(v);
  return solid ? { kind: 'solid', color: solid } : null;
}

// preserveAspectRatio es exactamente object-fit + object-position, pero nativo
// en SVG: no hay lógica que escribir, solo una tabla.
const ALIGN = {
  center: 'xMidYMid',
  top: 'xMidYMin',
  bottom: 'xMidYMax',
  left: 'xMinYMid',
  right: 'xMaxYMid'
};
const MEET = { cover: 'slice', contain: 'meet' };

function aspectRatio(fit, pos) {
  if (fit === 'stretch') return 'none';
  return `${ALIGN[pos] || 'xMidYMid'} ${MEET[fit] || 'slice'}`;
}

// ------------------------------------------------------------------- fuentes

// Un GIF de 2 MB no puede volver a descargarse en cada render de cada tarjeta.
// ponytail: Map con TTL y desalojo del más antiguo; si algún día hace falta
// LRU real o caché compartida entre instancias, se cambia aquí.
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 32;
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    cache.delete(key);
    return null;
  }
  return hit.uri;
}

function cacheSet(key, uri) {
  cache.set(key, { uri, exp: Date.now() + CACHE_TTL_MS });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
}

// Rangos que un fetch disparado por un parámetro de la URL no debe alcanzar
// (SSRF): loopback, redes privadas, link-local, CGNAT, multicast y reservados.
export function isPrivateIp(ip) {
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return isPrivateIp(v.slice(7));
    return v === '::1' || v === '::' ||
      v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
  }
  if (!net.isIPv4(ip)) return true; // no lo entendemos, no lo tocamos
  const [a, b] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127);
}

// Descarga una imagen y la devuelve como data URI. Lanza si la URL no es
// aceptable o la respuesta no es una imagen razonable.
export async function fetchImageDataUri(rawUrl) {
  const cached = cacheGet(rawUrl);
  if (cached) return cached;

  const url = new URL(rawUrl);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`esquema no permitido: ${url.protocol}`);
  }

  const { address } = await dns.lookup(url.hostname);
  if (isPrivateIp(address)) {
    throw new Error(`destino no público: ${url.hostname} -> ${address}`);
  }

  const res = await axios.get(url.toString(), {
    responseType: 'arraybuffer',
    timeout: TIMEOUT_MS,
    maxContentLength: MAX_BYTES,
    maxRedirects: 0, // un 302 no puede llevarnos a una red interna
    // Sin User-Agent, bastantes hosts de imágenes (Wikimedia entre ellos)
    // responden 403 y el fondo se caía sin explicación.
    headers: { Accept: 'image/*', 'User-Agent': 'github-stats-cards/1.0 (+background fetch)' }
  });

  const type = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.includes(type)) {
    throw new Error(`content-type no admitido: ${type || '(vacío)'} — ¿es un enlace a la imagen o a la página que la contiene?`);
  }

  const buf = Buffer.from(res.data);
  if (buf.length > MAX_BYTES) {
    throw new Error(`imagen de ${buf.length} bytes, máximo ${MAX_BYTES}`);
  }

  const uri = `data:${type};base64,${buf.toString('base64')}`;
  cacheSet(rawUrl, uri);
  return uri;
}

// Preset alojado: sale de nuestro propio disco, así que no hay red, ni SSRF, ni
// timeout que vigilar. Solo hay que impedir salirse del directorio.
export async function readPresetDataUri(name) {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(name)) {
    throw new Error(`nombre de preset no válido: ${name}`);
  }
  const key = `preset:${name}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  for (const [ext, type] of Object.entries(EXT_TYPES)) {
    try {
      const buf = await fs.readFile(path.join(PRESET_DIR, name + ext));
      if (buf.length > MAX_BYTES) {
        throw new Error(`preset ${name}${ext} de ${buf.length} bytes, máximo ${MAX_BYTES}`);
      }
      const uri = `data:${type};base64,${buf.toString('base64')}`;
      cacheSet(key, uri);
      return uri;
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
  throw new Error(`preset no encontrado: ${name} (${Object.keys(EXT_TYPES).join(', ')})`);
}

// ------------------------------------------------------------------ pintado

function gradientDefs(spec) {
  const stops = spec.colors
    .map((c, i) => `<stop offset="${Math.round((i / (spec.colors.length - 1)) * 100)}%" stop-color="${c}"/>`)
    .join('');
  if (spec.kind === 'radial') {
    return `<radialGradient id="bgxFill" cx="50%" cy="50%" r="75%">${stops}</radialGradient>`;
  }
  // El gradiente base va de izquierda a derecha (= 90° en CSS), así que la
  // rotación necesaria es el ángulo pedido menos 90.
  return `<linearGradient id="bgxFill" x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(${spec.angle - 90} 0.5 0.5)">${stops}</linearGradient>`;
}

function presetLayers(spec, w, h, clip) {
  const p = PRESETS[spec.name];
  const px = (pct, total) => Math.round((pct / 100) * total);
  let defs = '';
  let layers = `\n      <rect x="0" y="0" width="${w}" height="${h}" fill="${p.base}" ${clip}/>`;

  (p.blobs || []).forEach(([color, cx, cy, r], i) => {
    const id = `bgxBlob${i}`;
    defs += `
      <radialGradient id="${id}">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>`;
    layers += `
      <ellipse cx="${px(cx, w)}" cy="${px(cy, h)}" rx="${px(r, w)}" ry="${px(r, h)}" fill="url(#${id})" ${clip}/>`;
  });

  if (p.grid) {
    defs += `
      <pattern id="bgxPresetGrid" width="${p.grid.size}" height="${p.grid.size}" patternUnits="userSpaceOnUse">
        <path d="M ${p.grid.size} 0 H 0 V ${p.grid.size}" fill="none" stroke="${p.grid.color}" stroke-width="1"/>
      </pattern>`;
    layers += `
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#bgxPresetGrid)" ${clip}/>`;
  }

  if (p.dots) {
    defs += `
      <pattern id="bgxPresetDots" width="${p.dots.size}" height="${p.dots.size}" patternUnits="userSpaceOnUse">
        <circle cx="${p.dots.size / 2}" cy="${p.dots.size / 2}" r="1.5" fill="${p.dots.color}"/>
      </pattern>`;
    layers += `
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#bgxPresetDots)" ${clip}/>`;
  }

  return { defs, layers };
}

// Desenfoque y blanco y negro sobre la imagen del usuario. El filtro se aplica
// solo a la imagen: emborronar un gradiente plano no hace nada.
function imageFilter(blur, gray) {
  if (!blur && !gray) return { defs: '', attr: '' };
  const prims =
    (gray ? '<feColorMatrix type="saturate" values="0"/>' : '') +
    (blur ? `<feGaussianBlur stdDeviation="${blur}"/>` : '');
  return {
    defs: `
      <filter id="bgxFx" x="-25%" y="-25%" width="150%" height="150%">${prims}</filter>`,
    attr: ' filter="url(#bgxFx)"'
  };
}

// Capa animada de cada tema. Cada entrada devuelve { defs, layers }: defs se
// interpola dentro del <defs> que ya tiene la tarjeta, layers justo después de
// su rect de fondo. Los ids y las animaciones van prefijados con `bgx` para no
// chocar con los que ya definen las tarjetas.
const MOTION = {
  cyberpunk: (w, h, clip) => ({
    defs: `
      <pattern id="bgxGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 H 0 V 40" fill="none" stroke="#00f5ff" stroke-width="1"/>
      </pattern>
      <linearGradient id="bgxSweep" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00f5ff" stop-opacity="0"/>
        <stop offset="50%" stop-color="#00f5ff" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="#00f5ff" stop-opacity="0"/>
      </linearGradient>
      <style>
        .bgx-grid { fill: url(#bgxGrid); opacity: 0.14; animation: bgxGridUp 7s linear infinite; }
        .bgx-sweep { fill: url(#bgxSweep); opacity: 0.14; animation: bgxSweepX 11s ease-in-out infinite; }
        @keyframes bgxGridUp { to { transform: translateY(40px); } }
        @keyframes bgxSweepX {
          0%, 100% { transform: translateX(-${w}px); }
          50% { transform: translateX(${w}px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bgx-grid, .bgx-sweep { animation: none; }
        }
      </style>`,
    layers: `
      <rect class="bgx-grid" x="0" y="-40" width="${w}" height="${h + 80}" ${clip}/>
      <rect class="bgx-sweep" x="0" y="0" width="${w}" height="${h}" ${clip}/>`
  }),

  terminal: (w, h, clip) => ({
    // Scanlines finas y separadas: la textura CRT tiene que insinuarse, no
    // competir con el texto verde.
    defs: `
      <pattern id="bgxScan" width="7" height="7" patternUnits="userSpaceOnUse">
        <rect width="7" height="1" fill="#00ff41"/>
      </pattern>
      <style>
        .bgx-scan { fill: url(#bgxScan); opacity: 0.07; animation: bgxScanDown 4s linear infinite; }
        .bgx-flicker { fill: #00ff41; animation: bgxFlicker 5s steps(1) infinite; }
        @keyframes bgxScanDown { to { transform: translateY(7px); } }
        @keyframes bgxFlicker {
          0%, 40%, 80% { opacity: 0.008; }
          20%, 60% { opacity: 0.022; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bgx-scan, .bgx-flicker { animation: none; }
        }
      </style>`,
    layers: `
      <rect class="bgx-scan" x="0" y="-7" width="${w}" height="${h + 14}" ${clip}/>
      <rect class="bgx-flicker" x="0" y="0" width="${w}" height="${h}" opacity="0.012" ${clip}/>`
  }),

  luxury: (w, h, clip) => ({
    defs: `
      <radialGradient id="bgxAurora" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#d4af37" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#d4af37" stop-opacity="0"/>
      </radialGradient>
      <style>
        .bgx-aurora { fill: url(#bgxAurora); animation: bgxDrift 24s ease-in-out infinite; }
        .bgx-aurora-2 { fill: url(#bgxAurora); animation: bgxDrift 24s ease-in-out infinite reverse; animation-delay: -12s; }
        @keyframes bgxDrift {
          0%, 100% { transform: translate(-${Math.round(w * 0.15)}px, 0); opacity: 0.35; }
          50% { transform: translate(${Math.round(w * 0.15)}px, ${Math.round(h * 0.1)}px); opacity: 0.7; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bgx-aurora, .bgx-aurora-2 { animation: none; opacity: 0.4; }
        }
      </style>`,
    layers: `
      <ellipse class="bgx-aurora" cx="${Math.round(w * 0.3)}" cy="${Math.round(h * 0.35)}" rx="${Math.round(w * 0.4)}" ry="${Math.round(h * 0.45)}" ${clip}/>
      <ellipse class="bgx-aurora-2" cx="${Math.round(w * 0.75)}" cy="${Math.round(h * 0.7)}" rx="${Math.round(w * 0.35)}" ry="${Math.round(h * 0.4)}" ${clip}/>`
  }),

  vaporwave: (w, h, clip) => ({
    defs: `
      <pattern id="bgxHorizon" width="26" height="26" patternUnits="userSpaceOnUse">
        <path d="M 26 0 H 0 V 26" fill="none" stroke="#3b1e6e" stroke-width="1"/>
      </pattern>
      <radialGradient id="bgxSun" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffcc70" stop-opacity="0.5"/>
        <stop offset="70%" stop-color="#ff71ce" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#ff71ce" stop-opacity="0"/>
      </radialGradient>
      <style>
        .bgx-horizon { fill: url(#bgxHorizon); opacity: 0.35; animation: bgxHorizonDown 5s linear infinite; }
        .bgx-sun { fill: url(#bgxSun); animation: bgxSunPulse 8s ease-in-out infinite; }
        @keyframes bgxHorizonDown { to { transform: translateY(26px); } }
        @keyframes bgxSunPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.94); }
          50% { opacity: 0.55; transform: scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bgx-horizon, .bgx-sun { animation: none; }
        }
      </style>`,
    // El sol va detrás del grid (el grid en primer plano es la firma vaporwave)
    // y es pequeño: uno grande lava el degradado de la tarjeta entera.
    // Se escala desde su centro; sin transform-origin escalaría desde el origen
    // del viewBox y se saldría de la tarjeta.
    layers: `
      <ellipse class="bgx-sun" cx="${Math.round(w * 0.82)}" cy="${Math.round(h * 0.22)}" rx="${Math.round(w * 0.13)}" ry="${Math.round(w * 0.13)}" style="transform-origin: ${Math.round(w * 0.82)}px ${Math.round(h * 0.22)}px;" ${clip}/>
      <rect class="bgx-horizon" x="0" y="-26" width="${w}" height="${h + 52}" ${clip}/>`
  }),

  brutalist: (w, h, clip) => ({
    // Brutalismo no interpola: la trama de rayas duras cambia de fase de golpe
    // con steps(), sin easing. Cubre toda la tarjeta, así lee como textura y no
    // como rectángulos sueltos encima del contenido.
    defs: `
      <pattern id="bgxStripe" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="16" fill="#000000"/>
      </pattern>
      <style>
        .bgx-stripe { fill: url(#bgxStripe); opacity: 0.045; animation: bgxPhase 2.4s steps(1) infinite; }
        @keyframes bgxPhase {
          0% { transform: translateX(0); }
          33% { transform: translateX(8px); }
          66% { transform: translateX(16px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bgx-stripe { animation: none; }
        }
      </style>`,
    layers: `
      <rect class="bgx-stripe" x="-32" y="-32" width="${w + 64}" height="${h + 64}" ${clip}/>`
  })
};

/**
 * Fondo de tarjeta: capa animada propia del tema y, opcionalmente, un fondo
 * del usuario (color, gradiente, preset o imagen/GIF).
 *
 * Se inserta sin tocar el rect de fondo que ya tiene cada tarjeta, así que los
 * colores de cada tema siguen viniendo de su propio CSS.
 *
 * @param {string} theme          cyberpunk | terminal | luxury | vaporwave | brutalist
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {string} [opts.bg]      ver parseBg()
 * @param {boolean} [opts.motion=true]
 * @param {number}  [opts.scrim]  opacidad 0-100 del velo (65 sobre imagen, 0 sobre color)
 * @param {string}  [opts.scrimColor]
 * @param {string}  [opts.fit]    cover | contain | stretch
 * @param {string}  [opts.pos]    center | top | bottom | left | right
 * @param {number}  [opts.blur]   0-20
 * @param {boolean} [opts.gray]
 * @param {string} [opts.clip]    atributo clip-path completo, si la tarjeta recorta
 * @returns {Promise<{defs: string, layers: string}>}
 */
export async function background(theme, opts = {}) {
  const {
    width, height, bg, motion = true,
    scrim, scrimColor, fit, pos, blur, gray, clip = ''
  } = opts;

  const parts = { defs: '', layers: '' };
  const spec = parseBg(bg);

  if (bg && !spec) {
    console.warn(`[background] bg no reconocido, se ignora: ${bg}`);
  }

  if (spec) {
    try {
      // Sobre una foto el velo es necesario para leer el texto; sobre un color
      // o un preset elegidos a propósito, estorba.
      const isImage = spec.kind === 'remote' || spec.kind === 'file';
      const veil = clampNum(scrim, 0, 100, isImage ? 65 : 0) / 100;

      if (isImage) {
        const dataUri = spec.kind === 'remote'
          ? await fetchImageDataUri(spec.url)
          : await readPresetDataUri(spec.name);

        const b = clampNum(blur, 0, 20, 0);
        const fx = imageFilter(b, Boolean(gray));
        parts.defs += fx.defs;
        // El desenfoque difumina también los bordes: se dibuja la imagen algo
        // más grande que la tarjeta para que no asome el fondo por los lados.
        const pad = b * 3;
        parts.layers += `
      <image href="${dataUri}" x="${-pad}" y="${-pad}" width="${width + pad * 2}" height="${height + pad * 2}" preserveAspectRatio="${aspectRatio(fit, pos)}"${fx.attr} ${clip}/>`;
      } else if (spec.kind === 'solid') {
        parts.layers += `
      <rect x="0" y="0" width="${width}" height="${height}" fill="${spec.color}" ${clip}/>`;
      } else if (spec.kind === 'preset') {
        const p = presetLayers(spec, width, height, clip);
        parts.defs += p.defs;
        parts.layers += p.layers;
      } else {
        parts.defs += gradientDefs(spec);
        parts.layers += `
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgxFill)" ${clip}/>`;
      }

      if (veil > 0) {
        const veilColor = normalizeColor(scrimColor) || SCRIM[theme] || '#000000';
        parts.layers += `
      <rect x="0" y="0" width="${width}" height="${height}" fill="${veilColor}" opacity="${veil}" ${clip}/>`;
      }
    } catch (err) {
      // Un fondo inválido no puede romper la tarjeta: en un README quedaría un
      // <img> roto. Se cae al fondo del tema y se registra.
      console.warn(`[background] bg descartado (${bg}): ${err.message}`);
      parts.defs = '';
      parts.layers = '';
    }
  }

  if (motion && MOTION[theme]) {
    const m = MOTION[theme](width, height, clip);
    parts.defs += m.defs;
    parts.layers += m.layers;
  }

  return parts;
}

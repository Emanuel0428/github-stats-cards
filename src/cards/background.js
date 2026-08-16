import dns from 'node:dns/promises';
import net from 'node:net';
import axios from 'axios';

// Las tarjetas se sirven como SVG dentro de un <img> (proxy camo de GitHub):
// no hay JS, ni fetch del navegador, ni <video>. El único movimiento que
// sobrevive ahí es CSS/SMIL declarativo dentro del propio SVG, y la única forma
// de meter una imagen del usuario es que el servidor la descargue y la inlinee
// en base64. Este módulo hace las dos cosas.

const MAX_BYTES = 500 * 1024;
const TIMEOUT_MS = 5000;

// Solo raster: un SVG remoto inlineado sería un documento ajeno dentro del
// nuestro, y no hay razón para aceptar ese riesgo por un fondo.
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

// Color del velo que va sobre la imagen del usuario para que el texto de la
// tarjeta siga siendo legible. Brutalist es el único con fondo claro.
const SCRIM = {
  cyberpunk: '#0a0e27',
  terminal: '#0c0c0c',
  luxury: '#1a1a1a',
  vaporwave: '#241b3d',
  brutalist: '#ffffff'
};

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
    headers: { Accept: 'image/*' }
  });

  const type = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.includes(type)) {
    throw new Error(`content-type no admitido: ${type || '(vacío)'}`);
  }

  const buf = Buffer.from(res.data);
  if (buf.length > MAX_BYTES) {
    throw new Error(`imagen de ${buf.length} bytes, máximo ${MAX_BYTES}`);
  }
  return `data:${type};base64,${buf.toString('base64')}`;
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
 * Fondo de tarjeta: capa animada propia del tema y, opcionalmente, una imagen
 * del usuario inlineada.
 *
 * Se inserta sin tocar el rect de fondo que ya tiene cada tarjeta, así que los
 * colores de cada tema siguen viniendo de su propio CSS.
 *
 * @param {string} theme        cyberpunk | terminal | luxury | vaporwave | brutalist
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {string} [opts.bg]    URL de imagen de fondo (se descarga e inlinea)
 * @param {boolean} [opts.motion=true]
 * @param {string} [opts.clip]  atributo clip-path completo, si la tarjeta recorta
 * @returns {Promise<{defs: string, layers: string}>}
 */
export async function background(theme, { width, height, bg, motion = true, clip = '' } = {}) {
  const parts = { defs: '', layers: '' };

  if (bg) {
    try {
      const dataUri = await fetchImageDataUri(bg);
      const scrim = SCRIM[theme] || '#000000';
      parts.layers += `
      <image href="${dataUri}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" ${clip}/>
      <rect x="0" y="0" width="${width}" height="${height}" fill="${scrim}" opacity="0.65" ${clip}/>`;
    } catch (err) {
      // Un fondo inválido no puede romper la tarjeta: en un README quedaría un
      // <img> roto. Se cae al fondo del tema y se registra.
      console.warn(`[background] bg descartado (${bg}): ${err.message}`);
    }
  }

  if (motion && MOTION[theme]) {
    const m = MOTION[theme](width, height, clip);
    parts.defs += m.defs;
    parts.layers += m.layers;
  }

  return parts;
}

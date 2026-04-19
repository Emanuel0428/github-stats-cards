import { getTopLanguages } from '../utils/github.js';

const languageColors = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#239120',
  Go: '#00add8',
  Rust: '#ce422b',
  PHP: '#777bb4',
  Ruby: '#cc342d',
  Swift: '#fa7343',
  Kotlin: '#7f52ff',
  HTML: '#e34c26',
  CSS: '#264de4',
  SQL: '#e38c00',
};

export async function getTopLanguagesCard(username, preloadedLanguages = null) {
  const languages = preloadedLanguages || await getTopLanguages(username);
  
  // Adaptar altura según cantidad de lenguajes
  const langCount = languages.length;
  const limitedLanguages = languages.slice(0, Math.min(langCount, 15));

  const width = 520;
  const baseHeight = 120;
  const heightPerLang = 35;
  const bottomPadding = 40; // Padding inferior para mejor distribución
  const height = baseHeight + (limitedLanguages.length * heightPerLang) + bottomPadding;

  let yOffset = 85;
  let barsHTML = '';

  limitedLanguages.forEach((lang, index) => {
    const percentage = (lang.count / limitedLanguages[0].count) * 100;
    const barWidth = (percentage / 100) * 240;
    const color = languageColors[lang.language] || '#00f5ff';
    const y = yOffset + index * heightPerLang;

    // Crear forma orgánica para cada barra
    const waveOffset = Math.sin(index * 0.5) * 2;
    
    barsHTML += `
      <circle class="data-dot" cx="35" cy="${y + 3}" r="2"/>
      <text class="lang-name" x="45" y="${y + 7}">${lang.language}</text>
      
      <!-- Barra con forma líquida -->
      <defs>
        <linearGradient id="langGrad${index}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.4" />
        </linearGradient>
      </defs>
      
      <path class="lang-bar" 
        d="M 200,${y} 
           Q ${200 + barWidth * 0.25},${y + waveOffset} ${200 + barWidth * 0.5},${y} 
           T ${200 + barWidth},${y}
           L ${200 + barWidth},${y + 12}
           Q ${200 + barWidth * 0.75},${y + 12 - waveOffset} ${200 + barWidth * 0.5},${y + 12}
           T 200,${y + 12} Z"
        fill="url(#langGrad${index})"
        filter="url(#glow)"/>
      
      <text class="lang-percent" x="455" y="${y + 8}">${percentage.toFixed(0)}%</text>
    `;
  });

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0e27;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1f3a;stop-opacity:1" />
        </linearGradient>
        
        <linearGradient id="accentGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#00f5ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7b2ff7;stop-opacity:1" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
          <feColorMatrix type="saturate" values="0"/>
          <feBlend mode="multiply" in2="SourceGraphic" />
        </filter>

        <clipPath id="blobClip2">
          <path d="M 0,20 Q 0,0 20,0 L 480,0 Q 500,0 500,20 Q 510,40 500,60 L 500,${height - 40} Q 500,${height - 20} 480,${height - 20} L 40,${height - 20} Q 20,${height - 20} 20,${height - 40} L 20,40 Q 10,20 0,20 Z" />
        </clipPath>

        <style>
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&amp;family=JetBrains+Mono:wght@400;600&amp;display=swap');
          
          .card-bg { fill: url(#bgGrad2); }
          .noise-layer { opacity: 0.03; }
          
          .title { 
            font-family: 'Orbitron', monospace; 
            font-size: 20px; 
            font-weight: 900; 
            fill: #00f5ff; 
            text-transform: uppercase;
            letter-spacing: 2px;
            filter: url(#glow);
          }
          
          .lang-name { 
            font-family: 'JetBrains Mono', monospace; 
            font-size: 12px; 
            fill: #ffffff; 
            font-weight: 600;
          }
          
          .lang-bar { }
          
          .lang-percent { 
            font-family: 'Orbitron', monospace; 
            font-size: 14px; 
            fill: #7b8ea8; 
            font-weight: 700;
          }
          
          .accent-line {
            stroke: url(#accentGrad2);
            stroke-width: 2;
            fill: none;
          }

          .corner-accent {
            fill: none;
            stroke: #00f5ff;
            stroke-width: 2;
            opacity: 0.6;
          }

          .data-dot {
            fill: #00f5ff;
            opacity: 0.8;
          }
        </style>
      </defs>

      <!-- Background -->
      <rect class="card-bg" x="0" y="0" width="${width}" height="${height}" clip-path="url(#blobClip2)"/>
      <rect class="noise-layer" x="0" y="0" width="${width}" height="${height}" filter="url(#noise)" clip-path="url(#blobClip2)"/>

      <!-- Corner accents -->
      <path class="corner-accent" d="M 15,15 L 15,35 M 15,15 L 35,15"/>
      <path class="corner-accent" d="M 505,15 L 485,15 M 505,15 L 505,35"/>
      <path class="corner-accent" d="M 15,${height - 15} L 15,${height - 35} M 15,${height - 15} L 35,${height - 15}"/>
      <path class="corner-accent" d="M 505,${height - 15} L 485,${height - 15} M 505,${height - 15} L 505,${height - 35}"/>

      <!-- Title -->
      <text class="title" x="30" y="45">TOP LANGUAGES</text>
      <path class="accent-line" d="M 30,55 L 250,55"/>

      <!-- Language bars -->
      ${barsHTML}
    </svg>
  `;
}

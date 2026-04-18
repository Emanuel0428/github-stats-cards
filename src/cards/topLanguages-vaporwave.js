import { getTopLanguages } from '../utils/github.js';

const languageColors = {
  JavaScript: '#fffb96',
  TypeScript: '#01cdfe',
  Python: '#05ffa1',
  Java: '#b967ff',
  'C++': '#ff71ce',
  'C#': '#fffb96',
  Go: '#01cdfe',
  Rust: '#ff71ce',
  PHP: '#b967ff',
  Ruby: '#ff71ce',
  Swift: '#05ffa1',
  Kotlin: '#b967ff',
  HTML: '#ff71ce',
  CSS: '#01cdfe',
  SQL: '#fffb96',
};

export async function getTopLanguagesVaporwaveCard(username, preloadedLanguages = null) {
  const languages = preloadedLanguages || await getTopLanguages(username);
  
  const limitedLanguages = languages.slice(0, 7);

  const width = 520;
  const height = 340;

  let yOffset = 105;
  let barsHTML = '';

  limitedLanguages.forEach((lang, index) => {
    const percentage = (lang.count / limitedLanguages[0].count) * 100;
    const barWidth = (percentage / 100) * 240;
    const color = languageColors[lang.language] || '#05ffa1';
    const y = yOffset + index * 35;

    barsHTML += `
      <text class="lang-name" x="45" y="${y + 7}">${lang.language}</text>
      <rect x="200" y="${y}" width="${barWidth}" height="14" fill="${color}" opacity="0.8"/>
      <text class="lang-percent" x="455" y="${y + 10}">${percentage.toFixed(0)}%</text>
    `;
  });

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vaporBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff71ce;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#01cdfe;stop-opacity:1" />
        </linearGradient>
        
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#05ffa1" stroke-width="0.5" opacity="0.3"/>
        </pattern>
        
        <style>
          .card-bg { fill: url(#vaporBg); }
          .grid-bg { fill: url(#grid); }
          
          .title { 
            font-family: 'Impact', 'Arial Black', sans-serif; 
            font-size: 26px; 
            font-weight: 400; 
            fill: #ffffff; 
            text-transform: uppercase;
            letter-spacing: 3px;
          }
          
          .lang-name { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            fill: #ffffff; 
            font-weight: 600;
          }
          
          .lang-percent { 
            font-family: 'Impact', 'Arial Black', sans-serif; 
            font-size: 14px; 
            fill: #fffb96; 
            font-weight: 400;
          }
        </style>
      </defs>

      <!-- Background -->
      <rect class="card-bg" x="0" y="0" width="${width}" height="${height}"/>
      <rect class="grid-bg" x="0" y="0" width="${width}" height="${height}"/>

      <!-- Title -->
      <text class="title" x="30" y="50">TOP LANGUAGES</text>

      <!-- Language bars -->
      ${barsHTML}
    </svg>
  `.trim();
}

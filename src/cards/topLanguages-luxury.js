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

export async function getTopLanguagesLuxuryCard(username, preloadedLanguages = null) {
  const languages = preloadedLanguages || await getTopLanguages(username);
  
  const limitedLanguages = languages.slice(0, 6);

  const width = 520;
  const height = 340;

  let yOffset = 105;
  let barsHTML = '';

  limitedLanguages.forEach((lang, index) => {
    const percentage = (lang.count / limitedLanguages[0].count) * 100;
    const barWidth = (percentage / 100) * 240;
    const color = languageColors[lang.language] || '#d4af37';
    const y = yOffset + index * 35;

    barsHTML += `
      <text class="lang-name" x="45" y="${y + 7}">${lang.language}</text>
      <rect x="200" y="${y}" width="${barWidth}" height="12" fill="${color}" opacity="0.8"/>
      <text class="lang-percent" x="455" y="${y + 8}">${percentage.toFixed(0)}%</text>
    `;
  });

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#d4af37;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffd700;stop-opacity:1" />
        </linearGradient>
        
        <style>
          .card-bg { fill: #1a1a1a; }
          
          .title { 
            font-family: Georgia, serif; 
            font-size: 24px; 
            font-weight: 700; 
            fill: url(#goldGrad); 
            text-transform: uppercase;
            letter-spacing: 4px;
          }
          
          .lang-name { 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            fill: #ffffff; 
            font-weight: 600;
          }
          
          .lang-percent { 
            font-family: Georgia, serif; 
            font-size: 14px; 
            fill: #b8b8b8; 
            font-weight: 700;
          }
          
          .luxury-border {
            fill: none;
            stroke: url(#goldGrad);
            stroke-width: 1;
            opacity: 0.8;
          }
          
          .luxury-corner {
            fill: #d4af37;
          }
        </style>
      </defs>

      <!-- Background -->
      <rect class="card-bg" x="0" y="0" width="${width}" height="${height}"/>
      
      <!-- Luxury borders -->
      <rect class="luxury-border" x="20" y="20" width="${width-40}" height="${height-40}"/>
      <rect class="luxury-border" x="24" y="24" width="${width-48}" height="${height-48}"/>
      
      <!-- Corner decorations -->
      <circle class="luxury-corner" cx="20" cy="20" r="2"/>
      <circle class="luxury-corner" cx="${width-20}" cy="20" r="2"/>
      <circle class="luxury-corner" cx="20" cy="${height-20}" r="2"/>
      <circle class="luxury-corner" cx="${width-20}" cy="${height-20}" r="2"/>

      <!-- Title -->
      <text class="title" x="40" y="55">TOP LANGUAGES</text>

      <!-- Language bars -->
      ${barsHTML}
    </svg>
  `.trim();
}

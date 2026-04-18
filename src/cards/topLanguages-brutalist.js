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

export async function getTopLanguagesBrutalistCard(username) {
  const languages = await getTopLanguages(username);
  
  const limitedLanguages = languages.slice(0, 7);

  const width = 520;
  const height = 340;

  let yOffset = 95;
  let barsHTML = '';

  limitedLanguages.forEach((lang, index) => {
    const percentage = (lang.count / limitedLanguages[0].count) * 100;
    const barWidth = (percentage / 100) * 240;
    const color = languageColors[lang.language] || '#000000';
    const y = yOffset + index * 35;

    barsHTML += `
      <text class="lang-name" x="45" y="${y + 7}">${lang.language}</text>
      <rect x="200" y="${y}" width="${barWidth}" height="14" fill="${color}"/>
      <text class="lang-percent" x="455" y="${y + 10}">${percentage.toFixed(0)}%</text>
    `;
  });

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .card-bg { fill: #ffffff; }
          
          .title { 
            font-family: 'Courier New', monospace; 
            font-size: 24px; 
            font-weight: 700; 
            fill: #000000; 
            text-transform: uppercase;
          }
          
          .lang-name { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            fill: #000000; 
            font-weight: 700;
          }
          
          .lang-percent { 
            font-family: 'Courier New', monospace; 
            font-size: 14px; 
            fill: #666666; 
            font-weight: 700;
          }
          
          .accent-line {
            stroke: #000000;
            stroke-width: 3;
            fill: none;
          }

          .heavy-border {
            fill: none;
            stroke: #000000;
            stroke-width: 8;
          }
        </style>
      </defs>

      <!-- Background -->
      <rect class="card-bg" x="0" y="0" width="${width}" height="${height}"/>
      
      <!-- Heavy border -->
      <rect class="heavy-border" x="4" y="4" width="${width-8}" height="${height-8}" rx="0"/>

      <!-- Title -->
      <text class="title" x="30" y="50">TOP LANGUAGES</text>
      <path class="accent-line" d="M 30,60 L 250,60"/>

      <!-- Language bars -->
      ${barsHTML}
    </svg>
  `.trim();
}

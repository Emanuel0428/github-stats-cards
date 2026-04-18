import { getTopLanguages } from '../utils/github.js';

const languageColors = {
  JavaScript: '#00ff00',
  TypeScript: '#00ff00',
  Python: '#00ff00',
  Java: '#00ff00',
  'C++': '#00ff00',
  'C#': '#00ff00',
  Go: '#00ff00',
  Rust: '#00ff00',
  PHP: '#00ff00',
  Ruby: '#00ff00',
  Swift: '#00ff00',
  Kotlin: '#00ff00',
  HTML: '#00ff00',
  CSS: '#00ff00',
  SQL: '#00ff00',
};

export async function getTopLanguagesTerminalCard(username) {
  const languages = await getTopLanguages(username);
  
  const limitedLanguages = languages.slice(0, 7);

  const width = 520;
  const height = 340;

  let yOffset = 105;
  let barsHTML = '';

  limitedLanguages.forEach((lang, index) => {
    const percentage = (lang.count / limitedLanguages[0].count) * 100;
    const barWidth = (percentage / 100) * 240;
    const barChars = Math.floor(barWidth / 8);
    const y = yOffset + index * 35;

    barsHTML += `
      <text class="lang-name" x="30" y="${y + 7}">${lang.language}</text>
      <text class="terminal-bar" x="200" y="${y + 7}">${'█'.repeat(barChars)}</text>
      <text class="lang-percent" x="455" y="${y + 7}">${percentage.toFixed(0)}%</text>
    `;
  });

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .card-bg { fill: #0c0c0c; }
          
          .title { 
            font-family: 'Courier New', monospace; 
            font-size: 18px; 
            font-weight: 700; 
            fill: #00ff00;
          }
          
          .lang-name { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            fill: #00ff00; 
            font-weight: 600;
          }
          
          .terminal-bar {
            font-family: 'Courier New', monospace; 
            font-size: 10px; 
            fill: #00ff00;
          }
          
          .lang-percent { 
            font-family: 'Courier New', monospace; 
            font-size: 14px; 
            fill: #008800; 
            font-weight: 700;
          }
          
          .terminal-prompt {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            fill: #00ff00;
          }
          
          .cursor {
            fill: #00ff00;
            animation: blink 1s infinite;
          }
          
          @keyframes blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
        </style>
      </defs>

      <!-- Background -->
      <rect class="card-bg" x="0" y="0" width="${width}" height="${height}"/>

      <!-- Terminal prompt -->
      <text class="terminal-prompt" x="20" y="30">user@github:~$</text>
      <rect class="cursor" x="130" y="17" width="8" height="16"/>

      <!-- Title -->
      <text class="title" x="20" y="60">cat languages.txt</text>

      <!-- Language bars -->
      ${barsHTML}
    </svg>
  `.trim();
}

import { getUserStats } from '../utils/github.js';
import { calculateRank } from '../utils/rank.js';

export async function getStatsBrutalistCard(username, preloadedStats = null) {
  const stats = preloadedStats || await getUserStats(username);
  const rank = calculateRank(stats.stars, stats.commits, stats.prs, stats.issues);

  const width = 520;
  const includeStreaks = stats.streaks !== undefined;
  const height = includeStreaks ? 340 : 280;

  // Construir las estadísticas dinámicamente
  let statsHTML = '';
  let yOffset = 95;
  
  const statItems = [
    { label: 'STARS', value: stats.stars, icon: 'star' },
    { label: 'COMMITS', value: stats.commits, icon: 'commit' },
    { label: 'PULL REQ', value: stats.prs, icon: 'pr' },
    { label: 'ISSUES', value: stats.issues, icon: 'issue' },
    { label: 'CONTRIB', value: stats.contributedTo, icon: 'contrib' }
  ];

  // Añadir rachas si están disponibles
  if (includeStreaks && stats.streaks) {
    statItems.push(
      { label: 'CURRENT', value: `${stats.streaks.current}d`, icon: 'fire' },
      { label: 'LONGEST', value: `${stats.streaks.longest}d`, icon: 'trophy' }
    );
  }

  const iconsMap = {
    star: '<path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z" fill="#000000" opacity="0.8"/>',
    commit: '<path fill-rule="evenodd" d="M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z" fill="#000000" opacity="0.8"/>',
    pr: '<path fill-rule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" fill="#000000" opacity="0.8"/>',
    issue: '<path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" fill="#000000" opacity="0.8"/>',
    contrib: '<path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" fill="#000000" opacity="0.8"/>',
    fire: '<path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-3-1.5-4.5-.5.5-1 1-2 1-1.5 0-2.5-1.5-3-3-.5 1.5-1.5 3-3 3-1 0-1.5-.5-2-1C1.5 7.5 1 9 1 10.5 1 14 3.686 16 7 16h1zm-.5-10c.828 0 1.5-.895 1.5-2s-.672-2-1.5-2S6 2.895 6 4s.672 2 1.5 2z" fill="#000000" opacity="0.8"/>',
    trophy: '<path d="M3.217 6.962A3.75 3.75 0 010 3.25v-.5C0 2.336.336 2 .75 2h2.5c.414 0 .75.336.75.75v.5c0 .818-.393 1.544-1 2v5.5c0 .945.54 1.76 1.326 2.16a21.07 21.07 0 01-2.124 1.172C.956 13.229 0 11.917 0 10.5V5c-.607-.456-1-.182-1-1v-.5C-1 2.336-.664 2-.25 2h2.5c.414 0 .75.336.75.75v.5c0 .818.393 1.544 1 2v5.5c0 1.417-.956 2.729-2.202 3.582a21.07 21.07 0 01-2.124-1.172C5.46 12.26 6 11.445 6 10.5V5c.607-.456 1-1.182 1-2v-.5c0-.414.336-.75.75-.75h2.5c.414 0 .75.336.75.75v.5a3.75 3.75 0 01-3.217 3.712 5.014 5.014 0 00-2.566 0z" fill="#000000" opacity="0.8"/>'
  };

  // Distribuir estadísticas en columnas
  const itemsPerColumn = Math.ceil(statItems.length / 2);
  
  statItems.forEach((item, index) => {
    const column = Math.floor(index / itemsPerColumn);
    const row = index % itemsPerColumn;
    const x = column === 0 ? 35 : 250;
    const y = yOffset + row * 65;
    // Iconos de la columna derecha más a la izquierda para evitar solapamiento con rank
    const iconX = column === 0 ? x + 100 : x + 80;
    const iconY = y + 10;

    statsHTML += `
      <text class="stat-label" x="${x}" y="${y}">${item.label}</text>
      <text class="stat-value" x="${x}" y="${y + 30}">${item.value}</text>
      <g transform="translate(${iconX}, ${iconY})">
        ${iconsMap[item.icon] || iconsMap.star}
      </g>
    `;
  });

  const rankY = height / 2 + 10;

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
          
          .stat-label { 
            font-family: 'Courier New', monospace; 
            font-size: 11px; 
            fill: #666666; 
            text-transform: uppercase;
            font-weight: 400;
          }
          
          .stat-value { 
            font-family: 'Courier New', monospace; 
            font-size: 32px; 
            font-weight: 700; 
            fill: #000000;
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
          
          .rank-text { 
            font-family: 'Courier New', monospace; 
            font-size: 48px; 
            font-weight: 700; 
            fill: #000000; 
            text-anchor: middle;
          }
          
          .rank-box {
            fill: none;
            stroke: #000000;
            stroke-width: 6;
          }
        </style>
      </defs>

      <!-- Background -->
      <rect class="card-bg" x="0" y="0" width="${width}" height="${height}"/>
      
      <!-- Heavy border -->
      <rect class="heavy-border" x="4" y="4" width="${width-8}" height="${height-8}" rx="0"/>

      <!-- Title section -->
      <text class="title" x="30" y="50">${username}</text>
      <path class="accent-line" d="M 30,60 L 200,60"/>

      <!-- Stats grid -->
      ${statsHTML}

      <!-- Rank section -->
      <rect class="rank-box" x="360" y="${rankY - 60}" width="120" height="120"/>
      <text class="rank-text" x="420" y="${rankY + 15}">${rank}</text>
    </svg>
  `.trim();
}

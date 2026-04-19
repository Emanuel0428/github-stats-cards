import { getUserStats } from '../utils/github.js';
import { calculateRank } from '../utils/rank.js';

export async function getStatsCard(username, preloadedStats = null) {
  const stats = preloadedStats || await getUserStats(username);
  const rank = calculateRank(stats.stars, stats.commits, stats.prs, stats.issues);

  const width = 520;
  const includeStreaks = stats.streaks !== undefined;
  const height = includeStreaks ? 340 : 280;

  // Construir las estadísticas dinámicamente
  let statsHTML = '';
  let yOffset = 83;
  
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
      { label: 'CURRENT STREAK', value: `${stats.streaks.current}d`, icon: 'fire' },
      { label: 'LONGEST STREAK', value: `${stats.streaks.longest}d`, icon: 'trophy' }
    );
  }

  const iconsMap = {
    star: '<path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z" fill="#00f5ff" opacity="0.6" filter="url(#glow)"/>',
    commit: '<path fill-rule="evenodd" d="M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z" fill="#00f5ff" opacity="0.6" filter="url(#glow)"/>',
    pr: '<path fill-rule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" fill="#00f5ff" opacity="0.6" filter="url(#glow)"/>',
    issue: '<path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" fill="#00f5ff" opacity="0.6" filter="url(#glow)"/>',
    contrib: '<path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" fill="#00f5ff" opacity="0.6" filter="url(#glow)"/>',
    fire: '<path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-3-1.5-4.5-.5.5-1 1-2 1-1.5 0-2.5-1.5-3-3-.5 1.5-1.5 3-3 3-1 0-1.5-.5-2-1C1.5 7.5 1 9 1 10.5 1 14 3.686 16 7 16h1zm-.5-10c.828 0 1.5-.895 1.5-2s-.672-2-1.5-2S6 2.895 6 4s.672 2 1.5 2z" fill="#ff6b35" opacity="0.8" filter="url(#glow)"/>',
    trophy: '<path d="M3.217 6.962A3.75 3.75 0 010 3.25v-.5C0 2.336.336 2 .75 2h2.5c.414 0 .75.336.75.75v.5c0 .818-.393 1.544-1 2v5.5c0 .945.54 1.76 1.326 2.16a21.07 21.07 0 01-2.124 1.172C.956 13.229 0 11.917 0 10.5V5c-.607-.456-1-.182-1-1v-.5C-1 2.336-.664 2-.25 2h2.5c.414 0 .75.336.75.75v.5c0 .818.393 1.544 1 2v5.5c0 1.417-.956 2.729-2.202 3.582a21.07 21.07 0 01-2.124-1.172C5.46 12.26 6 11.445 6 10.5V5c.607-.456 1-1.182 1-2v-.5c0-.414.336-.75.75-.75h2.5c.414 0 .75.336.75.75v.5a3.75 3.75 0 01-3.217 3.712 5.014 5.014 0 00-2.566 0z" fill="#ffd700" opacity="0.8" filter="url(#glow)"/>'
  };

  // Distribuir estadísticas en columnas
  const itemsPerColumn = Math.ceil(statItems.length / 2);
  
  statItems.forEach((item, index) => {
    const column = Math.floor(index / itemsPerColumn);
    const row = index % itemsPerColumn;
    const x = column === 0 ? 35 : 250;
    const y = yOffset + row * 65;
    // Iconos de la columna derecha más a la izquierda para evitar solapamiento con rank
    const iconX = column === 0 ? x + 85 : x + 70;
    const iconY = y + 5; // Centrado verticalmente con el valor

    statsHTML += `
      <text class="stat-label" x="${x}" y="${y}">${item.label}</text>
      <text class="stat-value" x="${x}" y="${y + 27}">${item.value}</text>
      <g transform="translate(${iconX}, ${iconY})">
        ${iconsMap[item.icon] || iconsMap.star}
      </g>
    `;
  });

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0e27;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1f3a;stop-opacity:1" />
        </linearGradient>
        
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#00f5ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7b2ff7;stop-opacity:1" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
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

        <clipPath id="blobClip">
          <path d="M 0,20 Q 0,0 20,0 L 480,0 Q 500,0 500,20 Q 510,40 500,60 L 500,${height - 40} Q 500,${height - 20} 480,${height - 20} L 40,${height - 20} Q 20,${height - 20} 20,${height - 40} L 20,40 Q 10,20 0,20 Z" />
        </clipPath>

        <style>
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&amp;family=JetBrains+Mono:wght@400;700&amp;display=swap');
          
          .card-bg { fill: url(#bgGrad); }
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
          
          .stat-label { 
            font-family: 'JetBrains Mono', monospace; 
            font-size: 10px; 
            fill: #7b8ea8; 
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 400;
          }
          
          .stat-value { 
            font-family: 'Orbitron', monospace; 
            font-size: 28px; 
            font-weight: 700; 
            fill: #ffffff;
            filter: url(#glow);
          }
          
          .accent-line {
            stroke: url(#accentGrad);
            stroke-width: 2;
            fill: none;
          }
          
          .rank-blob {
            fill: #7b2ff7;
            opacity: 0.15;
          }
          
          .rank-ring {
            fill: none;
            stroke: url(#accentGrad);
            stroke-width: 3;
            filter: url(#glow);
          }
          
          .rank-text { 
            font-family: 'Orbitron', monospace; 
            font-size: 48px; 
            font-weight: 900; 
            fill: #00f5ff; 
            text-anchor: middle;
            filter: url(#glow);
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

      <!-- Background with clip path -->
      <rect class="card-bg" x="0" y="0" width="${width}" height="${height}" clip-path="url(#blobClip)"/>
      <rect class="noise-layer" x="0" y="0" width="${width}" height="${height}" filter="url(#noise)" clip-path="url(#blobClip)"/>

      <!-- Corner accents -->
      <path class="corner-accent" d="M 15,15 L 15,35 M 15,15 L 35,15"/>
      <path class="corner-accent" d="M 505,15 L 485,15 M 505,15 L 505,35"/>
      <path class="corner-accent" d="M 15,${height - 15} L 15,${height - 35} M 15,${height - 15} L 35,${height - 15}"/>
      <path class="corner-accent" d="M 505,${height - 15} L 485,${height - 15} M 505,${height - 15} L 505,${height - 35}"/>

      <!-- Title section -->
      <text class="title" x="30" y="45">${username} GIT STATS</text>
      <path class="accent-line" d="M 30,55 L 200,55"/>

      <!-- Stats grid -->
      ${statsHTML}

      <!-- Rank blob -->
      <ellipse class="rank-blob" cx="420" cy="${height / 2 + 10}" rx="70" ry="85" transform="rotate(-15 420 ${height / 2 + 10})"/>
      <circle class="rank-ring" cx="420" cy="${height / 2 + 10}" r="55"/>
      <text class="rank-text" x="420" y="${height / 2 + 30}">${rank}</text>
    </svg>
  `;
}

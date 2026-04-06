import { getUserStats } from '../utils/github.js';
import { calculateRank } from '../utils/rank.js';

export async function getStatsCard(username) {
  const stats = await getUserStats(username);
  const rank = calculateRank(stats.stars, stats.commits, stats.prs, stats.issues);

  const width = 520;
  const height = 280;

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
          <path d="M 0,20 Q 0,0 20,0 L 480,0 Q 500,0 500,20 Q 510,40 500,60 L 500,240 Q 500,260 480,260 L 40,260 Q 20,260 20,240 L 20,40 Q 10,20 0,20 Z" />
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
      <path class="corner-accent" d="M 15,265 L 15,245 M 15,265 L 35,265"/>
      <path class="corner-accent" d="M 505,265 L 485,265 M 505,265 L 505,245"/>

      <!-- Title section -->
      <text class="title" x="30" y="45">${username} GIT STATS</text>
      <path class="accent-line" d="M 30,55 L 200,55"/>

      <!-- Stats grid -->
      <text class="stat-label" x="35" y="83">STARS</text>
      <text class="stat-value" x="35" y="110">${stats.stars}</text>
      <!-- Star icon -->
      <g transform="translate(120, 95)">
        <path d="M8 0.5L10.163 5.528L15.609 6.298L11.804 10.014L12.708 15.439L8 13.139L3.292 15.439L4.196 10.014L0.391 6.298L5.837 5.528L8 0.5Z" 
              fill="#00f5ff" opacity="0.6" filter="url(#glow)" transform="scale(0.9)"/>
      </g>

      <text class="stat-label" x="35" y="148">COMMITS</text>
      <text class="stat-value" x="35" y="175">${stats.commits}</text>
      <!-- Commit icon -->
      <g transform="translate(120, 160)">
        <circle cx="8" cy="8" r="3" fill="none" stroke="#00f5ff" stroke-width="1.5" opacity="0.6" filter="url(#glow)"/>
        <path d="M8 0 L8 5 M8 11 L8 16 M0 8 L5 8 M11 8 L16 8" 
              stroke="#00f5ff" stroke-width="1.5" opacity="0.6" filter="url(#glow)" transform="scale(0.7) translate(3.5, 3.5)"/>
      </g>

      <text class="stat-label" x="35" y="213">PULL REQ</text>
      <text class="stat-value" x="35" y="240">${stats.prs}</text>
      <!-- PR icon -->
      <g transform="translate(120, 225)">
        <path d="M3 3 L3 13 M13 3 L13 8 M13 8 Q13 10 11 10 L8 10 M3 1 A2 2 0 1 1 3 5 A2 2 0 1 1 3 1 M3 11 A2 2 0 1 1 3 15 A2 2 0 1 1 3 11 M13 1 A2 2 0 1 1 13 5 A2 2 0 1 1 13 1" 
              fill="none" stroke="#00f5ff" stroke-width="1.5" opacity="0.6" filter="url(#glow)" transform="scale(0.9)"/>
      </g>

      <text class="stat-label" x="250" y="83">ISSUES</text>
      <text class="stat-value" x="250" y="110">${stats.issues}</text>
      <!-- Issue icon -->
      <g transform="translate(320, 95)">
        <circle cx="8" cy="8" r="7" fill="none" stroke="#00f5ff" stroke-width="1.5" opacity="0.6" filter="url(#glow)" transform="scale(0.9)"/>
        <circle cx="8" cy="11" r="1" fill="#00f5ff" opacity="0.6" transform="scale(0.9)"/>
        <path d="M8 4 L8 9" stroke="#00f5ff" stroke-width="1.5" opacity="0.6" filter="url(#glow)" transform="scale(0.9)"/>
      </g>

      <text class="stat-label" x="250" y="148">CONTRIB</text>
      <text class="stat-value" x="250" y="175">${stats.contributedTo}</text>
      <!-- Contrib icon -->
      <g transform="translate(320, 160)">
        <rect x="1" y="5" width="2" height="2" fill="#00f5ff" opacity="0.3"/>
        <rect x="4" y="5" width="2" height="2" fill="#00f5ff" opacity="0.5"/>
        <rect x="7" y="5" width="2" height="2" fill="#00f5ff" opacity="0.8"/>
        <rect x="10" y="5" width="2" height="2" fill="#00f5ff" opacity="0.6"/>
        <rect x="13" y="5" width="2" height="2" fill="#00f5ff" opacity="0.4"/>
        <rect x="1" y="8" width="2" height="2" fill="#00f5ff" opacity="0.5"/>
        <rect x="4" y="8" width="2" height="2" fill="#00f5ff" opacity="0.8" filter="url(#glow)"/>
        <rect x="7" y="8" width="2" height="2" fill="#00f5ff" opacity="0.6"/>
        <rect x="10" y="8" width="2" height="2" fill="#00f5ff" opacity="0.8"/>
        <rect x="13" y="8" width="2" height="2" fill="#00f5ff" opacity="0.3"/>
        <rect x="1" y="11" width="2" height="2" fill="#00f5ff" opacity="0.4"/>
        <rect x="4" y="11" width="2" height="2" fill="#00f5ff" opacity="0.6"/>
        <rect x="7" y="11" width="2" height="2" fill="#00f5ff" opacity="0.5"/>
        <rect x="10" y="11" width="2" height="2" fill="#00f5ff" opacity="0.7"/>
        <rect x="13" y="11" width="2" height="2" fill="#00f5ff" opacity="0.5"/>
      </g>

      <!-- Rank blob -->
      <ellipse class="rank-blob" cx="420" cy="150" rx="70" ry="85" transform="rotate(-15 420 150)"/>
      <circle class="rank-ring" cx="420" cy="150" r="55"/>
      <text class="rank-text" x="420" y="170">${rank}</text>
    </svg>
  `;
}

import { getUserStats } from '../utils/github.js';
import { calculateRank } from '../utils/rank.js';

export async function getStatsBrutalistCard(username) {
  const stats = await getUserStats(username);
  const rank = calculateRank(stats.stars, stats.commits, stats.prs, stats.issues);

  const width = 520;
  const height = 280;

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
      <text class="stat-label" x="35" y="95">STARS</text>
      <text class="stat-value" x="35" y="125">${stats.stars}</text>

      <text class="stat-label" x="35" y="165">COMMITS</text>
      <text class="stat-value" x="35" y="195">${stats.commits}</text>

      <text class="stat-label" x="250" y="95">PULL REQ</text>
      <text class="stat-value" x="250" y="125">${stats.prs}</text>

      <text class="stat-label" x="250" y="165">ISSUES</text>
      <text class="stat-value" x="250" y="195">${stats.issues}</text>

      <!-- Rank section -->
      <rect class="rank-box" x="360" y="90" width="120" height="120"/>
      <text class="rank-text" x="420" y="165">${rank}</text>
    </svg>
  `.trim();
}

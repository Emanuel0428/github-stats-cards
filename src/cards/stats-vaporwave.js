import { getUserStats } from '../utils/github.js';
import { calculateRank } from '../utils/rank.js';

export async function getStatsVaporwaveCard(username) {
  const stats = await getUserStats(username);
  const rank = calculateRank(stats.stars, stats.commits, stats.prs, stats.issues);

  const width = 520;
  const height = 280;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vaporBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff71ce;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#01cdfe;stop-opacity:1" />
        </linearGradient>
        
        <linearGradient id="vaporAccent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#05ffa1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#b967ff;stop-opacity:1" />
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
          
          .stat-label { 
            font-family: 'Courier New', monospace; 
            font-size: 14px; 
            fill: #fffb96; 
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 400;
          }
          
          .stat-value { 
            font-family: 'Impact', 'Arial Black', sans-serif; 
            font-size: 36px; 
            font-weight: 400; 
            fill: #ffffff;
          }
          
          .rank-text { 
            font-family: 'Impact', 'Arial Black', sans-serif; 
            font-size: 48px; 
            font-weight: 400; 
            fill: #ffffff; 
            text-anchor: middle;
          }
        </style>
      </defs>

      <!-- Background -->
      <rect class="card-bg" x="0" y="0" width="${width}" height="${height}"/>
      <rect class="grid-bg" x="0" y="0" width="${width}" height="${height}"/>

      <!-- Title section -->
      <text class="title" x="30" y="50">${username}</text>

      <!-- Stats grid -->
      <text class="stat-label" x="35" y="95">STARS</text>
      <text class="stat-value" x="35" y="130">${stats.stars}</text>

      <text class="stat-label" x="35" y="175">COMMITS</text>
      <text class="stat-value" x="35" y="210">${stats.commits}</text>

      <text class="stat-label" x="250" y="95">PULL REQ</text>
      <text class="stat-value" x="250" y="130">${stats.prs}</text>

      <text class="stat-label" x="250" y="175">ISSUES</text>
      <text class="stat-value" x="250" y="210">${stats.issues}</text>

      <!-- Rank section -->
      <circle cx="420" cy="150" r="65" fill="#05ffa1" opacity="0.2"/>
      <circle cx="420" cy="150" r="55" fill="none" stroke="#ffffff" stroke-width="3"/>
      <text class="rank-text" x="420" y="170">${rank}</text>
    </svg>
  `.trim();
}

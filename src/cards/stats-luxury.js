import { getUserStats } from '../utils/github.js';
import { calculateRank } from '../utils/rank.js';

export async function getStatsLuxuryCard(username) {
  const stats = await getUserStats(username);
  const rank = calculateRank(stats.stars, stats.commits, stats.prs, stats.issues);

  const width = 520;
  const height = 280;

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
          
          .stat-label { 
            font-family: Arial, sans-serif; 
            font-size: 10px; 
            fill: #b8b8b8; 
            text-transform: uppercase;
            letter-spacing: 3px;
            font-weight: 300;
          }
          
          .stat-value { 
            font-family: Georgia, serif; 
            font-size: 32px; 
            font-weight: 700; 
            fill: #ffffff;
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
          
          .rank-text { 
            font-family: Georgia, serif; 
            font-size: 48px; 
            font-weight: 700; 
            fill: url(#goldGrad); 
            text-anchor: middle;
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

      <!-- Title section -->
      <text class="title" x="40" y="55">${username}</text>

      <!-- Stats grid -->
      <text class="stat-label" x="45" y="95">STARS</text>
      <text class="stat-value" x="45" y="125">${stats.stars}</text>

      <text class="stat-label" x="45" y="165">COMMITS</text>
      <text class="stat-value" x="45" y="195">${stats.commits}</text>

      <text class="stat-label" x="250" y="95">PULL REQ</text>
      <text class="stat-value" x="250" y="125">${stats.prs}</text>

      <text class="stat-label" x="250" y="165">ISSUES</text>
      <text class="stat-value" x="250" y="195">${stats.issues}</text>

      <!-- Rank section -->
      <circle cx="420" cy="150" r="55" fill="none" stroke="url(#goldGrad)" stroke-width="2"/>
      <text class="rank-text" x="420" y="170">${rank}</text>
    </svg>
  `.trim();
}

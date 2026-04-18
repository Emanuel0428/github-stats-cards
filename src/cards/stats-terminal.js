import { getUserStats } from '../utils/github.js';
import { calculateRank } from '../utils/rank.js';

export async function getStatsTerminalCard(username, preloadedStats = null) {
  const stats = preloadedStats || await getUserStats(username);
  const rank = calculateRank(stats.stars, stats.commits, stats.prs, stats.issues);

  const width = 520;
  const height = 280;

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
          
          .stat-label { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            fill: #008800; 
            font-weight: 400;
          }
          
          .stat-value { 
            font-family: 'Courier New', monospace; 
            font-size: 28px; 
            font-weight: 700; 
            fill: #00ff00;
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
          
          .rank-text { 
            font-family: 'Courier New', monospace; 
            font-size: 48px; 
            font-weight: 700; 
            fill: #00ff00; 
            text-anchor: middle;
          }
        </style>
      </defs>

      <!-- Background -->
      <rect class="card-bg" x="0" y="0" width="${width}" height="${height}"/>

      <!-- Terminal prompt -->
      <text class="terminal-prompt" x="20" y="30">user@github:~$</text>
      <rect class="cursor" x="130" y="17" width="8" height="16"/>

      <!-- Title section -->
      <text class="title" x="20" y="60">cat ${username}/stats.txt</text>

      <!-- Stats grid -->
      <text class="stat-label" x="30" y="95">stars:</text>
      <text class="stat-value" x="30" y="120">${stats.stars}</text>

      <text class="stat-label" x="30" y="155">commits:</text>
      <text class="stat-value" x="30" y="180">${stats.commits}</text>

      <text class="stat-label" x="30" y="215">pull_requests:</text>
      <text class="stat-value" x="30" y="240">${stats.prs}</text>

      <text class="stat-label" x="250" y="95">issues:</text>
      <text class="stat-value" x="250" y="120">${stats.issues}</text>

      <text class="stat-label" x="250" y="155">contributed:</text>
      <text class="stat-value" x="250" y="180">${stats.contributedTo}</text>

      <!-- Rank section -->
      <text class="terminal-prompt" x="370" y="100">[RANK]</text>
      <text class="rank-text" x="420" y="160">${rank}</text>
      <text class="terminal-prompt" x="370" y="200">------</text>
    </svg>
  `.trim();
}

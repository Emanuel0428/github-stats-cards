import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStatsCard } from './cards/stats-cyberpunk.js';
import { getTopLanguagesCard } from './cards/topLanguages-cyberpunk.js';
import { getStatsBrutalistCard } from './cards/stats-brutalist.js';
import { getTopLanguagesBrutalistCard } from './cards/topLanguages-brutalist.js';
import { getStatsTerminalCard } from './cards/stats-terminal.js';
import { getTopLanguagesTerminalCard } from './cards/topLanguages-terminal.js';
import { getStatsLuxuryCard } from './cards/stats-luxury.js';
import { getTopLanguagesLuxuryCard } from './cards/topLanguages-luxury.js';
import { getStatsVaporwaveCard } from './cards/stats-vaporwave.js';
import { getTopLanguagesVaporwaveCard } from './cards/topLanguages-vaporwave.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/stats', async (req, res) => {
  try {
    const { username, theme = 'cyberpunk' } = req.query;
    if (!username) {
      return res.status(400).send('Username is required');
    }
    
    let svg;
    switch(theme) {
      case 'brutalist':
        svg = await getStatsBrutalistCard(username);
        break;
      case 'terminal':
        svg = await getStatsTerminalCard(username);
        break;
      case 'luxury':
        svg = await getStatsLuxuryCard(username);
        break;
      case 'vaporwave':
        svg = await getStatsVaporwaveCard(username);
        break;
      default:
        svg = await getStatsCard(username);
    }
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.get('/top-languages', async (req, res) => {
  try {
    const { username, theme = 'cyberpunk' } = req.query;
    if (!username) {
      return res.status(400).send('Username is required');
    }
    
    let svg;
    switch(theme) {
      case 'brutalist':
        svg = await getTopLanguagesBrutalistCard(username);
        break;
      case 'terminal':
        svg = await getTopLanguagesTerminalCard(username);
        break;
      case 'luxury':
        svg = await getTopLanguagesLuxuryCard(username);
        break;
      case 'vaporwave':
        svg = await getTopLanguagesVaporwaveCard(username);
        break;
      default:
        svg = await getTopLanguagesCard(username);
    }
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

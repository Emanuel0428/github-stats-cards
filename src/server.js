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
import { getUserStats, getTopLanguages } from './utils/github.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Servir robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// Servir sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// Servir llms.txt para AI crawlers
app.get('/llms.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'public', 'llms.txt'));
});

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para obtener datos del usuario en JSON (para caché en frontend)
app.get('/api/user-data', async (req, res) => {
  try {
    const { username, includePrivate, includeStreaks, langLimit, includeForks } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const statsOptions = {
      includePrivate: includePrivate === 'true',
      includeStreaks: includeStreaks === 'true'
    };
    
    const langOptions = {
      limit: parseInt(langLimit) || 8,
      includeForks: includeForks === 'true'
    };
    
    const [stats, languages] = await Promise.all([
      getUserStats(username, statsOptions),
      getTopLanguages(username, langOptions)
    ]);
    
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({ stats, languages, options: { statsOptions, langOptions } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/stats', async (req, res) => {
  try {
    const { username, theme = 'cyberpunk', data } = req.query;
    if (!username) {
      return res.status(400).send('Username is required');
    }
    
    // Si se proporcionan datos pre-cargados, usarlos (para evitar llamadas a GitHub)
    let stats;
    if (data) {
      try {
        stats = JSON.parse(decodeURIComponent(data));
      } catch (e) {
        // Si falla el parsing, obtener datos normalmente
        stats = null;
      }
    }
    
    let svg;
    switch(theme) {
      case 'brutalist':
        svg = await getStatsBrutalistCard(username, stats);
        break;
      case 'terminal':
        svg = await getStatsTerminalCard(username, stats);
        break;
      case 'luxury':
        svg = await getStatsLuxuryCard(username, stats);
        break;
      case 'vaporwave':
        svg = await getStatsVaporwaveCard(username, stats);
        break;
      default:
        svg = await getStatsCard(username, stats);
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
    const { username, theme = 'cyberpunk', data } = req.query;
    if (!username) {
      return res.status(400).send('Username is required');
    }
    
    // Si se proporcionan datos pre-cargados, usarlos (para evitar llamadas a GitHub)
    let languages;
    if (data) {
      try {
        languages = JSON.parse(decodeURIComponent(data));
      } catch (e) {
        // Si falla el parsing, obtener datos normalmente
        languages = null;
      }
    }
    
    let svg;
    switch(theme) {
      case 'brutalist':
        svg = await getTopLanguagesBrutalistCard(username, languages);
        break;
      case 'terminal':
        svg = await getTopLanguagesTerminalCard(username, languages);
        break;
      case 'luxury':
        svg = await getTopLanguagesLuxuryCard(username, languages);
        break;
      case 'vaporwave':
        svg = await getTopLanguagesVaporwaveCard(username, languages);
        break;
      default:
        svg = await getTopLanguagesCard(username, languages);
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

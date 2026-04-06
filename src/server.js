import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStatsCard } from './cards/stats.js';
import { getTopLanguagesCard } from './cards/topLanguages.js';

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
    const { username } = req.query;
    if (!username) {
      return res.status(400).send('Username is required');
    }
    const svg = await getStatsCard(username);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.get('/top-languages', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).send('Username is required');
    }
    const svg = await getTopLanguagesCard(username);
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

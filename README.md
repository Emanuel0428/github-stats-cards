# GitHub Stats Cards

A custom GitHub statistics card generator with a cyberpunk-inspired design. This project was born from the idea of creating GitHub stats visualizations with my own style, while keeping it freely available for the community to use and contribute to.

Currently in active development and continuous evolution.

## About

This project generates dynamic SVG cards displaying GitHub statistics with a distinctive futuristic aesthetic. It features neon effects, gradients, and a clean layout that stands out from traditional stat cards.

## Features

- Real-time GitHub statistics (stars, commits, pull requests, issues, contributions)
- Top programming languages visualization with proportional bars
- **5 distinctive visual themes** with unique aesthetics
- Automatic caching for optimal performance
- Easy integration into any README or documentation
- Fully customizable through code

## Available Themes

Choose from 5 completely different visual styles:

### 1. **Cyberpunk** (Default)
Neon futuristic aesthetic with glow effects and dark backgrounds.
```markdown
![Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME&theme=cyberpunk)
```

### 2. **Brutalist**
Raw minimalism with bold typography and no effects - pure, unfiltered design.
```markdown
![Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME&theme=brutalist)
```

### 3. **Terminal**
Retro terminal aesthetic with green-on-black styling and monospace fonts.
```markdown
![Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME&theme=terminal)
```

### 4. **Luxury**
Refined elegance with gold accents on dark backgrounds.
```markdown
![Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME&theme=luxury)
```

### 5. **Vaporwave**
Retro 80s/90s aesthetic with pastel gradients and grid patterns.
```markdown
![Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME&theme=vaporwave)
```

## Usage

### Basic Usage (Default Cyberpunk Theme)
```markdown
![GitHub Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME)
![Top Languages](https://github-stats-cards-six.vercel.app/top-languages?username=YOUR_USERNAME)
```

### With Custom Theme
```markdown
![GitHub Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME&theme=brutalist)
![Top Languages](https://github-stats-cards-six.vercel.app/top-languages?username=YOUR_USERNAME&theme=vaporwave)
```

**Available themes:** `cyberpunk`, `brutalist`, `terminal`, `luxury`, `vaporwave`

Replace `YOUR_USERNAME` with your GitHub username.

## Example

```markdown
![GitHub Stats](https://github-stats-cards-six.vercel.app/stats?username=Emanuel0428&theme=cyberpunk)
![Top Languages](https://github-stats-cards-six.vercel.app/top-languages?username=Emanuel0428&theme=luxury)
```

Mix and match themes for stats and languages cards!

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/Emanuel0428/github-stats-cards.git
cd github-stats-cards
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your GitHub token:
```env
PAT_1=your_github_token_here
PORT=3000
```

> Create a GitHub Personal Access Token at [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
> 
> Required scopes: `public_repo`, `read:user`

4. Start the development server:
```bash
npm start
```

The server will run at `http://localhost:3000`

## Deployment

This project is optimized for deployment on Vercel:

1. Fork this repository
2. Import the project into [Vercel](https://vercel.com)
3. Add the `PAT_1` environment variable with your GitHub token
4. Deploy

The configuration is already set up in `vercel.json`.

## Project Structure

```
├── src/
│   ├── cards/
│   │   ├── stats.js           # Statistics card generator
│   │   └── topLanguages.js    # Languages card generator
│   ├── themes/
│   │   ├── themes.js          # Theme definitions
│   │   └── themeRenderer.js   # Theme rendering utilities
│   ├── utils/
│   │   ├── github.js          # GitHub API integration
│   │   └── rank.js            # Ranking system
│   ├── public/
│   │   └── index.html         # Interactive demo page
│   └── server.js              # Express server
├── .env                       # Environment variables
├── package.json
└── vercel.json               # Vercel configuration
```

## Customization

### Creating Custom Themes

The visual style can be customized by editing theme files:
- `src/themes/themes.js` - Define new themes with colors, fonts, and effects
- `src/themes/themeRenderer.js` - Customize rendering logic for special effects

Each theme includes:
- **Fonts**: Custom font families from Google Fonts
- **Colors**: Background, accent, text colors
- **Effects**: Glow, noise, borders, and special decorations
- **Styles**: Typography sizes, weights, and transformations

### Modifying Existing Cards
- `src/cards/stats.js` - Statistics card layout and design
- `src/cards/topLanguages.js` - Languages card layout and design

## Contributing

Contributions are welcome and appreciated. Whether it's bug fixes, new features, or design improvements, feel free to:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## Technical Details

- Built with Node.js and Express
- Uses GitHub REST API for data fetching
- Generates dynamic SVG graphics
- Implements intelligent caching (1 hour)
- Responsive design compatible with all platforms

## License

MIT License - Free to use for any purpose.

## Acknowledgments

Inspired by [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) with a completely redesigned aesthetic approach.

---

**Status:** Active development | Open to contributions | Community-driven

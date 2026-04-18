# GitHub Stats Cards

A custom GitHub statistics card generator with multiple distinctive themes. This project was born from the idea of creating GitHub stats visualizations with unique aesthetics, while keeping it freely available for the community to use and contribute to.

> [!NOTE]
> Currently in active development and continuous evolution. New themes and features are added regularly.

## About

This project generates dynamic SVG cards displaying GitHub statistics with distinctive visual themes. From cyberpunk neon to brutalist minimalism, each theme offers a unique aesthetic that stands out from traditional stat cards.

> [!TIP]
> Mix and match different themes for your stats and languages cards to create a unique profile look!

## Quick Start

> [!IMPORTANT]
> Want to use these cards right away? Just copy and paste this into your GitHub profile README:

```markdown
![GitHub Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME&theme=cyberpunk)
![Top Languages](https://github-stats-cards-six.vercel.app/top-languages?username=YOUR_USERNAME&theme=cyberpunk)
```

Replace `YOUR_USERNAME` with your GitHub username and choose your favorite theme!

**Available themes:** `cyberpunk` | `brutalist` | `terminal` | `luxury` | `vaporwave`

## Features

✨ **Real-time Statistics**
- Stars, commits, pull requests, issues, and contributions
- Automatic data fetching from GitHub API
- Smart caching for optimal performance

🎨 **5 Distinctive Themes**
- Each with unique visual identity
- Mix and match for creative combinations
- Easy to customize and extend

⚡ **Performance Optimized**
- 1-hour intelligent caching
- Minimal API calls
- Fast SVG generation

🔧 **Developer Friendly**
- Clean, modular code structure
- Easy theme creation
- Well-documented codebase

📱 **Universal Compatibility**
- Works on all GitHub profiles
- Responsive design
- No external dependencies

## Available Themes

> [!IMPORTANT]
> All themes are optimized for both light and dark GitHub profiles. Choose the one that best matches your style!

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

> [!TIP]
> You can preview all themes live at `http://localhost:3000` when running the development server.

Replace `YOUR_USERNAME` with your GitHub username.

## Example

```markdown
![GitHub Stats](https://github-stats-cards-six.vercel.app/stats?username=Emanuel0428&theme=cyberpunk)
![Top Languages](https://github-stats-cards-six.vercel.app/top-languages?username=Emanuel0428&theme=luxury)
```

Mix and match themes for stats and languages cards!

## Local Development

> [!WARNING]
> You need a GitHub Personal Access Token to run this project locally. Without it, API requests will fail.

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

> [!IMPORTANT]
> Create a GitHub Personal Access Token at [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
> 
> **Required scopes:** `public_repo`, `read:user`
> 
> **Never commit your `.env` file** - it's already in `.gitignore` for your safety.

4. Start the development server:
```bash
npm start
```

The server will run at `http://localhost:3000`

> [!TIP]
> Use the interactive demo page at `http://localhost:3000` to test all themes with different usernames before deploying.

## Deployment

> [!NOTE]
> This project is optimized for deployment on Vercel, but can be deployed on any Node.js hosting platform.

This project is optimized for deployment on Vercel:

1. Fork this repository
2. Import the project into [Vercel](https://vercel.com)
3. Add the `PAT_1` environment variable with your GitHub token
4. Deploy

> [!CAUTION]
> Make sure to add your GitHub token as an environment variable in Vercel's settings, not in the code. Exposing your token publicly can compromise your GitHub account security.

The configuration is already set up in `vercel.json`.

## Project Structure

```
├── src/
│   ├── cards/
│   │   ├── stats.js                    # Cyberpunk theme stats
│   │   ├── topLanguages.js             # Cyberpunk theme languages
│   │   ├── stats-brutalist.js          # Brutalist theme stats
│   │   ├── topLanguages-brutalist.js   # Brutalist theme languages
│   │   ├── stats-terminal.js           # Terminal theme stats
│   │   ├── topLanguages-terminal.js    # Terminal theme languages
│   │   ├── stats-luxury.js             # Luxury theme stats
│   │   ├── topLanguages-luxury.js      # Luxury theme languages
│   │   ├── stats-vaporwave.js          # Vaporwave theme stats
│   │   └── topLanguages-vaporwave.js   # Vaporwave theme languages
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

> [!TIP]
> Creating a new theme is easy! Just copy an existing theme file and modify the colors and fonts to match your vision.

### Creating Custom Themes

Each theme is implemented in separate files for easy customization:
- `src/cards/stats-[theme].js` - Stats card for specific theme
- `src/cards/topLanguages-[theme].js` - Languages card for specific theme

To create a new theme:
1. Copy an existing theme file (e.g., `stats-brutalist.js`)
2. Modify colors, fonts, and layout
3. Import and add the new theme to `src/server.js`
4. Add the theme option to the HTML selector

> [!WARNING]
> Avoid using external font imports (like Google Fonts) in SVG files. Browsers block external resources when SVGs are embedded as images. Use system fonts instead: `Arial`, `Georgia`, `Courier New`, `Times New Roman`, `Verdana`.

Each theme can customize:
- **Fonts**: System fonts or web-safe fonts (avoid external font loading in SVG)
- **Colors**: Background, accent, text colors
- **Layout**: Positioning, spacing, decorations
- **Effects**: Gradients, patterns, borders

### Modifying Existing Themes
Simply edit the corresponding theme file in `src/cards/` to adjust colors, fonts, or layout.

## Contributing

> [!NOTE]
> Contributions are welcome and appreciated! Whether it's bug fixes, new themes, features, or design improvements, feel free to contribute.

Contributions are welcome and appreciated. Whether it's bug fixes, new features, or design improvements, feel free to:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

> [!TIP]
> When creating a new theme, make sure to test it with different usernames and data to ensure it looks good in all scenarios.

## Technical Details

> [!NOTE]
> This project uses the GitHub REST API with intelligent caching to minimize API calls and stay within rate limits.

- Built with Node.js and Express
- Uses GitHub REST API for data fetching
- Generates dynamic SVG graphics
- Implements intelligent caching (1 hour)
- Responsive design compatible with all platforms
- No external dependencies for rendering (pure SVG)

> [!IMPORTANT]
> **Rate Limits:** GitHub API has rate limits. The 1-hour cache helps minimize requests. For high-traffic deployments, consider implementing additional caching strategies.

## Troubleshooting

### Cards not loading?

> [!WARNING]
> If cards show errors or don't load, check these common issues:

1. **Invalid username** - Make sure the GitHub username exists and is spelled correctly
2. **GitHub token expired** - Regenerate your Personal Access Token
3. **Rate limit exceeded** - Wait a few minutes or use a different token
4. **Cache issues** - Add `&t=timestamp` to the URL to bypass cache

### SVG not rendering in browser?

> [!CAUTION]
> SVGs embedded as `<img>` cannot load external resources. If you're creating custom themes, use system fonts only.

**System fonts that work:**
- `Arial`, `Helvetica`, `sans-serif`
- `Georgia`, `Times New Roman`, `serif`
- `Courier New`, `monospace`
- `Verdana`, `Tahoma`
- `Impact`, `Arial Black`

### Need help?

> [!TIP]
> Open an issue on GitHub with:
> - Your username
> - The theme you're using
> - A screenshot of the error
> - Browser console logs (F12 → Console)

## License

MIT License - Free to use for any purpose.

## Acknowledgments

Inspired by [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) with a completely redesigned aesthetic approach.

---

> [!NOTE]
> **Status:** Active development | Open to contributions | Community-driven
>
> ⭐ If you find this project useful, consider giving it a star on GitHub!

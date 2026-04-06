# GitHub Stats Cards

A custom GitHub statistics card generator with a cyberpunk-inspired design. This project was born from the idea of creating GitHub stats visualizations with my own style, while keeping it freely available for the community to use and contribute to.

Currently in active development and continuous evolution.

## About

This project generates dynamic SVG cards displaying GitHub statistics with a distinctive futuristic aesthetic. It features neon effects, gradients, and a clean layout that stands out from traditional stat cards.

## Features

- Real-time GitHub statistics (stars, commits, pull requests, issues, contributions)
- Top programming languages visualization with proportional bars
- Cyberpunk-inspired design with glow effects
- Automatic caching for optimal performance
- Easy integration into any README or documentation
- Fully customizable through code

## Usage

### Stats Card
```markdown
![GitHub Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME)
```

### Top Languages Card
```markdown
![Top Languages](https://github-stats-cards-six.vercel.app/top-languages?username=YOUR_USERNAME)
```

Replace `YOUR_USERNAME` with your GitHub username.

## Example

```markdown
![GitHub Stats](https://github-stats-cards-six.vercel.app/stats?username=Emanuel0428)
![Top Languages](https://github-stats-cards-six.vercel.app/top-languages?username=Emanuel0428)
```

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
│   ├── utils/
│   │   ├── github.js          # GitHub API integration
│   │   └── rank.js            # Ranking system
│   ├── public/
│   │   └── index.html         # Landing page
│   └── server.js              # Express server
├── .env                       # Environment variables
├── package.json
└── vercel.json               # Vercel configuration
```

## Customization

The visual style can be modified by editing the card files:
- `src/cards/stats.js` - Statistics card design
- `src/cards/topLanguages.js` - Languages card design

Colors, fonts, and layout are defined in the SVG styles within each file.

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

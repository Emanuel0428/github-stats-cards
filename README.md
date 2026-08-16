# GitHub Stats Cards

[![Live demo](https://img.shields.io/badge/demo-live-brightgreen)](https://github-stats-cards-six.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/Emanuel0428/github-stats-cards?style=social)](https://github.com/Emanuel0428/github-stats-cards)

GitHub stats cards for your profile README, in five themes. No signup, no token on your side — paste one line of markdown.

**[Try it →](https://github-stats-cards-six.vercel.app)** Pick a theme, preview your own cards, copy the markdown.

## Quick start

```markdown
![GitHub Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME&theme=cyberpunk)
![Top Languages](https://github-stats-cards-six.vercel.app/top-languages?username=YOUR_USERNAME&theme=cyberpunk)
```

Replace `YOUR_USERNAME`, swap `theme=` for any of `cyberpunk`, `brutalist`, `terminal`, `luxury`, `vaporwave`. The two cards are independent, so you can mix themes.

## Themes

Every theme animates its own background — a drifting grid in Cyberpunk, CRT scanlines in Terminal, a gold aurora in Luxury, a scrolling horizon in Vaporwave, a snapping hatch in Brutalist. It's CSS inside the SVG, so it runs in a README with no scripts and no extra requests. Readers with "reduce motion" enabled always get a still card.

### Cyberpunk

![Cyberpunk stats](https://github-stats-cards-six.vercel.app/stats?username=Emanuel0428&theme=cyberpunk) ![Cyberpunk languages](https://github-stats-cards-six.vercel.app/top-languages?username=Emanuel0428&theme=cyberpunk)

### Brutalist

![Brutalist stats](https://github-stats-cards-six.vercel.app/stats?username=Emanuel0428&theme=brutalist) ![Brutalist languages](https://github-stats-cards-six.vercel.app/top-languages?username=Emanuel0428&theme=brutalist)

### Terminal

![Terminal stats](https://github-stats-cards-six.vercel.app/stats?username=Emanuel0428&theme=terminal) ![Terminal languages](https://github-stats-cards-six.vercel.app/top-languages?username=Emanuel0428&theme=terminal)

### Luxury

![Luxury stats](https://github-stats-cards-six.vercel.app/stats?username=Emanuel0428&theme=luxury) ![Luxury languages](https://github-stats-cards-six.vercel.app/top-languages?username=Emanuel0428&theme=luxury)

### Vaporwave

![Vaporwave stats](https://github-stats-cards-six.vercel.app/stats?username=Emanuel0428&theme=vaporwave) ![Vaporwave languages](https://github-stats-cards-six.vercel.app/top-languages?username=Emanuel0428&theme=vaporwave)

## Options

Two endpoints, `/stats` and `/top-languages`. Both take `username` (required) and:

| Parameter | Values | Default | Effect |
| --- | --- | --- | --- |
| `theme` | `cyberpunk` `brutalist` `terminal` `luxury` `vaporwave` | `cyberpunk` | Visual theme |
| `includeStreaks` | `true` | off | Adds current and longest contribution streak |
| `includePrivate` | `true` | off | Counts private repos and commits. Only works for the account that owns the server's token |
| `langLimit` | `3`–`15` | `8` | Languages shown (`/top-languages`) |
| `includeForks` | `true` | off | Counts forked repos in the language breakdown |
| `motion` | `off` | on | Renders a completely static card |
| `bg` | see below | — | Replaces the theme background |
| `scrim` | `0`–`100` | `65` over an image, `0` over a colour | Overlay opacity, keeps text readable |
| `scrimColor` | hex | the theme's own | Overlay colour |
| `bgFit` | `cover` `contain` `stretch` | `cover` | How an image fills the card |
| `bgPos` | `center` `top` `bottom` `left` `right` | `center` | Which part survives the crop |
| `bgBlur` | `0`–`20` | `0` | Blurs the image |
| `bgGray` | `on` | off | Drops the image to greyscale |

Set `includeStreaks` on both cards if you show them side by side — it's what makes them the same height.

### Backgrounds

`bg` takes one of six forms:

| Value | Background |
| --- | --- |
| `0d1117` | Flat colour (hex without `#` — a literal `#` never reaches the server) |
| `linear:ff71ce,01cdfe:135` | Gradient, 2–5 stops, CSS angle optional |
| `radial:ff71ce,01cdfe` | Radial gradient |
| `mesh-neon` | Generated preset: `mesh-neon` `mesh-sunset` `mesh-mint` `mesh-ember` `grid-dark` `grid-light` `dots-dark` |
| `preset:my-loop` | A file you dropped in [`src/public/backgrounds/`](src/public/backgrounds/) |
| `https://…/loop.gif` | Any public image or GIF |

```markdown
![GitHub Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME&bg=mesh-neon)
![GitHub Stats](https://github-stats-cards-six.vercel.app/stats?username=YOUR_USERNAME&bg=https://example.com/loop.gif&bgBlur=6&scrim=75)
```

Remote images must be a public PNG, JPEG, GIF or WebP of 2MB or less. The server downloads it and embeds it in the card, which is why it works inside a README — a plain `<img>`-embedded SVG can't fetch anything itself. Animated GIFs keep looping. Downloads are cached for 10 minutes.

If anything about `bg` fails — a dead link, a file that's too big, or a URL pointing at the *page* containing an image instead of the image itself — the card falls back to its theme background rather than breaking. Check the server logs when a background doesn't show up.

> [!NOTE]
> Video backgrounds aren't possible in a README: GitHub serves cards as images, and an SVG in that context can't play video or load anything external. An animated GIF is the closest thing, and it works.

## Running it yourself

You need a GitHub personal access token — the server uses it to query the API, so your visitors don't need one.

```bash
git clone https://github.com/Emanuel0428/github-stats-cards.git
cd github-stats-cards
npm install
```

Create a `.env`:

```env
PAT_1=your_github_token_here
PORT=3000
```

Generate the token at [Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) with the `public_repo` and `read:user` scopes. Add `repo` instead of `public_repo` if you want `includePrivate=true` to work for your own account.

```bash
npm start          # http://localhost:3000
npm run check      # card rendering, background parsing and landing page checks
npm run check-token
```

Deploys to Vercel as-is: import the repo and set `PAT_1` as an environment variable.

## License

MIT. Inspired by [github-readme-stats](https://github.com/anuraghazra/github-readme-stats), with a different take on the visuals.

# Block Blast - Web Edition

An authentic, standalone web clone of the popular Block Blast puzzle game.

## Features
- **Authentic Arcade Gameplay**: 8x8 grid with genuine block shapes, combos, streaks, and scoring.
- **Classic & Adventure Modes**: Freeplay endless score chase or 96+ progressive stage puzzles with gem objectives.
- **Smart Placement Assistant**: Biased piece generator to sustain rewarding combo chains.
- **Idle Hint System**: Suggests the optimal placement and previews line clears when taking time to think.
- **Power-Up Blocks**: Bomb (3x3 board blast) and Lightning (field sweep) specials.
- **Second Chance Revive**: Rescue clear and pieces to keep high-score runs alive.
- **Full Audio & Visual Polish**: Authentic voices (Good, Great, Amazing, Unbelievable), dynamic pitch progression, board danger aura, and confetti celebrations.
- **Ultra Lightweight & Offline-Ready**: Pure HTML5/Canvas/CSS/JS without external build dependencies or backend services (~1.3 MB total payload).

## Quick Start (Local)
You can run any local static file server:

```bash
# Python 3
python -m http.server 8080

# Node.js npx
npx serve .
```

Open `http://localhost:8080` in any browser.

## Deployment to the Web
This project is 100% static and ready to deploy instantly:

### GitHub Pages
1. Push this folder to a GitHub repository.
2. In Repository Settings -> Pages, select branch `main` (or `gh-pages`) and root `/`.
3. Save and your game is live!

### Vercel / Netlify / Cloudflare Pages
- Simply drag-and-drop this folder or link your git repo. No build command is required (leave build command empty, publish directory as `.`).

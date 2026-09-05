# Campward on GitHub Pages

This folder is the static version of Campward, built to be served by GitHub
Pages. It's plain HTML, CSS and JavaScript — no build step, no server.

| File | What it is |
|---|---|
| `index.html` | The page shell and the whole design system |
| `app.js` | Storage, views, weather, geocoding, routing |
| `config.js` | Your Supabase values — the only file you need to edit |
| `SETUP.md` | How to share one logbook between two people |
| `logo/` | The Campward brand artwork |

## Turning Pages on

In the repository: **Settings → Pages → Source: Deploy from a branch**, pick
the branch, set the folder to **`/docs`**, and Save. A minute later the site
is live at `https://sarahhouchens-cpu.github.io/Campward/`.

## How it differs from the app in the repository root

The root of this repository holds a Next.js version of Campward that stores
everything in a SQLite file. It has the same features and the same design, but
it needs Node running, so it can't be served by GitHub Pages. Use it if you'd
rather keep your data in a single file on your own machine.

This version trades that for a link that works from anywhere.

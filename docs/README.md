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

## The cookbook

Meals can be kept for reuse. Planning one and clicking **Save to cookbook**
stores it with its ingredients; on any later trip, **Add from the cookbook**
drops the meal in and its ingredients land straight on that trip's shopping
list. Saving a meal whose name is already in the cookbook updates it rather
than making a second copy.

This lives only in this build — the Next.js version in the repository root
does not have it.

## Scanning gear

The gear page has **Scan a barcode**. It uses the browser's built-in
`BarcodeDetector` where there is one (Chrome, Android) and falls back to ZXing
everywhere else, which is what iPhones use since Safari has no such API. The
camera needs HTTPS and a tap to start — GitHub Pages gives the first, the
button gives the second.

Scanning a code already on an item opens that item. Scanning a new one opens
the add form with the code filled in, and makes a best-effort attempt at the
product name via UPCitemdb's open trial endpoint — no key, rate limited, and
it knows nothing about most outdoor gear, so treat a filled-in name as a bonus
rather than the point. The code is stored on the item either way, so the
second scan of anything always finds it.

UPC-A and EAN-13 are the same label with and without a leading zero, and
readers disagree about which they report, so codes are compared with leading
zeros stripped.

## How it differs from the app in the repository root

The root of this repository holds a Next.js version of Campward that stores
everything in a SQLite file. It has the same features and the same design, but
it needs Node running, so it can't be served by GitHub Pages. Use it if you'd
rather keep your data in a single file on your own machine.

This version trades that for a link that works from anywhere.

# Campward

A field logbook for camping trips — trips, campsites, hikes, gear, weather and
meals, kept in one place for two people. It is a personal tool, not a product:
no accounts, no sign-in, no cloud.

## What's in it

| | |
|---|---|
| **Trips** | Name, location (address → coordinates), dates, notes, planned vs. logged. Each trip is the spine everything else hangs off. |
| **Campsites** | 1–5 rating, site number, date, "would we stay again", and notes. Browsable on their own or from inside a trip. |
| **Hikes** | Distance, elevation gain, difficulty and views rated separately, "would do again", notes. |
| **Gear** | The closet: category, condition, quantity, weight. Items marked *Needs repair* raise a banner. |
| **Packing list** | Per trip: pull items out of the closet, check them off as they go in the truck, reset for the next trip. |
| **Weather** | Forecast, active alerts, and packing hints derived from the forecast ("Rain likely — bring the shells"). |
| **Meals** | Meals per trip with ingredients; the ingredients roll up into one shopping list you check off as you buy. |

## Two ways to run it

| | |
|---|---|
| **`docs/`** | A static version for **GitHub Pages** — a link that works from any phone or laptop. Same features, same design. Saves to your browser by default; point it at a free Supabase project (see `docs/SETUP.md`) and you and your partner share one logbook. |
| **repository root** | The Next.js version below, which keeps everything in one SQLite file on your own machine. Nothing leaves the house, but it only runs where you run it. |

Both are the full six features. Pick whichever fits how you want to use it.

## Running the Next.js version

Requires **Node 22.5 or newer** — the database uses Node's built-in SQLite, so
there is nothing to compile and no database server to install.

```bash
npm install
npm run dev          # http://localhost:3000
```

For everyday use, build once and run the production server:

```bash
npm run build
npm start
```

Optionally stock the gear closet with the usual suspects (tent, bags, stove,
filter…) so the packing list has something to work with on day one:

```bash
npm run seed         # safe to re-run; only adds names that aren't there yet
```

## API keys

**None are needed.** Every external service Campward touches is open:

| Service | Used for | Key? |
|---|---|---|
| [api.weather.gov](https://www.weather.gov/documentation/services-web-api) | US forecasts and active weather alerts | No — asks only for a descriptive `User-Agent` |
| [Open-Meteo](https://open-meteo.com/) | Worldwide forecast fallback, outside NWS coverage | No |
| [Nominatim](https://nominatim.org/) (OpenStreetMap) | Turning an address into coordinates | No — asks for a `User-Agent`, max ~1 request/second |
| OpenStreetMap tiles | The small map on a trip page | No |

Those services ask to know who is calling. Set a contact address once:

```bash
# .env.local
CAMPWARD_CONTACT=you@example.com
```

It is a courtesy, not authentication — everything works without it. If you
later want a service that *does* need a key (hourly forecasts, air quality,
fire conditions), it would go in `.env.local` and be read in
`src/lib/weather.ts`; nothing else would change.

Trips without coordinates simply have no map and no forecast. Everything else
works.

## Where the data lives

One SQLite file: `data/campward.db`, created on first run and ignored by git.
Back it up by copying it. Move it somewhere else with:

```bash
CAMPWARD_DB_PATH=/path/to/campward.db npm start
```

Because it is one file, "sharing with a partner" can be as simple as putting it
in a synced folder — though the app is not built for two people writing at the
same instant. If you want simultaneous access, run it on one machine on your
home network and point both browsers at it:

```bash
npm start -- -H 0.0.0.0        # then http://<that-machine>:3000
```

There is no authentication, so keep it on your own network.

## Layout

```
src/
  app/
    page.tsx              the logbook — summary, next trip, recent entries
    trips/                list, new, [id] (the main working page), [id]/edit
    campsites/  hikes/  gear/
    api/weather/          forecast + packing hints for a coordinate pair
    api/geocode/          address → coordinates
    globals.css           the whole design system
  lib/
    db.ts                 SQLite connection + schema (migrations run on boot)
    queries.ts            every read
    actions.ts            every write (server actions)
    weather.ts            NWS with an Open-Meteo fallback, and packing hints
    format.ts  types.ts
  components/             forms, icons, logo, packing list, meal planner, weather
public/logo/              the supplied brand artwork
scripts/seed.mjs          starter gear closet
```

Writes are Next server actions posted from plain forms, so the checklists and
toggles work without client-side JavaScript and can't drift out of sync with
the database. The only client components are the address lookup and the nav.

## Design

Warm and analog on purpose — a field journal, not a dashboard. Paper grain
instead of gradients, uneven cut corners and stitched edges instead of drop
shadows, and a deliberately asymmetric two-column layout.

- **Forest Moss** `#3F4E3B` · **Sage** `#8A9A5B` · **Weathered Canvas** `#E4D8BE`
- **Trail Dust** `#A87C4F` · **Dusk Lake** `#4C6B73` · **Bone** `#F4EFE4` ·
  **Campfire Char** `#2B2620` · **Warm Glow** `#FFF8E7`
- Fraunces for headings, Karla for body, Caveat for the handwritten asides
  (used sparingly — marginalia only, never anything you need to read fast)

All of it lives in `src/app/globals.css` as custom properties; change the
colours at the top and the whole app follows.

### Brand assets

The supplied logo artwork is in `public/logo/` (see `public/logo/README.md` for
the original brief), unchanged apart from the one swap that brief asks for:
Georgia was a stand-in, so the wordmarks now specify Fraunces. How each is used:

| Asset | Used for |
|---|---|
| `campward-icon-only.svg` | The favicon, copied to `src/app/icon.svg` |
| `campward-logo-compact.svg` | Redrawn as `<CampwardMark>` for the masthead |
| `campward-logo-on-dark.svg` | The `onDark` tone, in the footer band |
| `campward-logo-full.svg` | Reference for the hero lockup and tagline |

The mark and wordmark are a component (`src/components/logo.tsx`) rather than an
embedded image, so the lockup scales, switches to the on-dark treatment, and
sets "Campward" as live text in the production serif.

The rest of the interface follows the mark's cues:

- **Icons match the logo's line quality** — even weights, flat geometric shapes,
  sage fills against moss line work. An irregular sketchy set read as a
  different brand sitting next to it.
- **The string lights** from the mark are the one piece of ornament, as the
  rule under the masthead and above the footer band.
- **Warm Glow** `#FFF8E7`, the light behind the bulbs in the full lockup, backs
  the one card that leads the logbook page (`.card-lit`).
- **Headings are set at the wordmark's weight** (700) so page titles and the
  logo read as the same voice.

## Ideas for later

- Photos attached to trips and campsites
- Export a trip as a printable page
- Reusable meal templates across trips
- Track which gear actually got used, to stop packing what you never touch

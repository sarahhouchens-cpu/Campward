# Sharing one logbook

Out of the box, Campward saves to whichever browser you're using. That's fine
for one person on one device, but your entries won't reach your phone or your
partner's laptop.

To share a single logbook, point it at a free Supabase database. Takes about
five minutes, no credit card.

## 1. Make a project

Go to [supabase.com](https://supabase.com), sign up, and create a new project.
Any name and region will do. Wait for it to finish setting up.

## 2. Create the table

In your project, open **SQL Editor** in the left sidebar, paste this in, and
click Run:

```sql
create table campward (
  id         text primary key,
  kind       text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table campward enable row level security;

create policy "logbook access" on campward
  for all using (true) with check (true);

alter publication supabase_realtime add table campward;
```

That last line is what makes an entry one of you adds appear on the other's
screen without a reload.

## 3. Copy your two values

Open **Project Settings → API**. You need:

- **Project URL** — looks like `https://abcdefgh.supabase.co`
- **anon public** key — a long string starting `eyJ...`

## 4. Paste them in

Edit `docs/config.js` in this repository and fill in the two values:

```js
window.CAMPWARD_CONFIG = {
  supabaseUrl: "https://abcdefgh.supabase.co",
  supabaseAnonKey: "eyJhbGciOi...",
  contact: "you@example.com",
};
```

Commit that change. Within a minute GitHub Pages rebuilds and the orange
"saving to this browser only" notice at the top disappears.

Anything already saved in your browser stays there — it doesn't move across
automatically. If you'd already logged a few trips, re-enter them once and
from then on everything lives in the shared logbook.

## Who can see it

Be aware of the trade-off you're making here.

The anon key sits in a public repository, and the policy above lets anyone
holding it read and write the logbook. In practice nobody finds it unless
they go looking through your repo — but it is not private, and you shouldn't
put anything sensitive in it.

If that bothers you, two options:

- **Make the repository private.** GitHub Pages on a private repo needs a paid
  GitHub plan.
- **Add a login.** Supabase has built-in authentication; the policy would
  change from `using (true)` to `using (auth.uid() is not null)`, and the app
  would need a sign-in screen.

Ask and either can be set up.

## API keys

Nothing else needs one. Weather comes from the National Weather Service
(`api.weather.gov`) with Open-Meteo as a worldwide fallback, address lookup
from OpenStreetMap's Nominatim, and map tiles from OpenStreetMap. All four
are open services that allow browser requests directly.

`contact` in `config.js` is optional — it's a courtesy so those services can
reach you if a request misbehaves, not authentication.

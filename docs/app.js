/* =============================================================================
   Campward — field logbook
   A single-page logbook that runs as static files, so it can live on GitHub
   Pages. Records are kept in Supabase when it is configured (one logbook,
   shared between people and devices) and in this browser otherwise.
   ============================================================================= */

"use strict";

const CFG = Object.assign(
  { supabaseUrl: "", supabaseAnonKey: "", contact: "" },
  window.CAMPWARD_CONFIG || {}
);

const KINDS = ["trip", "campsite", "hike", "gear", "packing", "meal", "mealitem"];

const GEAR_CATEGORIES = ["Shelter", "Sleep", "Kitchen", "Water", "Clothing",
  "Navigation", "Light", "Safety", "Camp Comfort", "Other"];

const GEAR_CONDITIONS = [["new", "New"], ["good", "Good"], ["worn", "Worn in"],
  ["repair", "Needs repair"], ["retired", "Retired"]];

const MEAL_SLOTS = [["breakfast", "Breakfast"], ["lunch", "Lunch"],
  ["dinner", "Dinner"], ["snack", "Snacks"]];

/* ------------------------------------------------------------- utilities -- */

const $ = (sel) => document.querySelector(sel);

/** Escape for interpolation into HTML. Everything user-typed goes through it. */
function esc(value) {
  if (value == null) return "";
  return String(value).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "Oct 9–12, 2026" when the range shares a month, otherwise spelled out. */
function fmtRange(start, end) {
  if (!start && !end) return "Dates not set";
  if (!start) return "Until " + fmtDate(end);
  if (!end || end === start) return fmtDate(start);
  const [sy, sm, sd] = start.slice(0, 10).split("-").map(Number);
  const [ey, em, ed] = end.slice(0, 10).split("-").map(Number);
  if (sy === ey && sm === em) return `${MONTHS[sm - 1]} ${sd}–${ed}, ${sy}`;
  if (sy === ey) return `${MONTHS[sm - 1]} ${sd} – ${MONTHS[em - 1]} ${ed}, ${sy}`;
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

function nights(start, end) {
  if (!start || !end) return null;
  const ms = Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z");
  return Number.isNaN(ms) ? null : Math.max(0, Math.round(ms / 86400000));
}

function daysUntil(start) {
  if (!start) return null;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const target = Date.parse(start + "T00:00:00Z");
  return Number.isNaN(target) ? null : Math.round((target - today) / 86400000);
}

function coordLabel(lat, lon) {
  if (lat == null || lon == null || lat === "" || lon === "") return "";
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ` +
         `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
}

function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

/* ------------------------------------------------------------------ icons -- */

const SAGE = "#8A9A5B", BONE = "#F4EFE4", DUST = "#A87C4F";

/* Drawn to match the Campward mark: even line weights, flat geometric shapes,
   sage fills against moss line work. */
function icon(name, size) {
  size = size || 20;
  const open = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`;
  const shapes = {
    tent: `<polygon points="12,3 21.5,20.5 2.5,20.5" fill="${SAGE}"/><line x1="12" y1="3" x2="12" y2="20.5"/>`,
    peak: `<polygon points="8.5,4 15,20.5 2,20.5" fill="${SAGE}"/>` +
          `<polygon points="16,9 22,20.5 10,20.5" fill="${SAGE}"/>` +
          `<polyline points="5.7,10.4 8.5,12.6 11.3,10.4"/>`,
    pack: `<rect x="5.5" y="7" width="13" height="13.5" rx="3" fill="${SAGE}"/>` +
          `<path d="M9.5 7V4.6a1.4 1.4 0 0 1 1.4-1.4h2.2a1.4 1.4 0 0 1 1.4 1.4V7"/>` +
          `<line x1="9" y1="12.5" x2="15" y2="12.5"/>`,
    cloud: `<path d="M7.2 16.5a3.7 3.7 0 0 1 -.4 -7.4 5 5 0 0 1 9.7 -1 3.6 3.6 0 0 1 -.3 8.4Z" fill="${SAGE}"/>` +
           `<path d="M8.4 19.4 7.6 21M12.2 19.3l-.8 1.6M16 19.4l-.8 1.6"/>`,
    pot: `<path d="M4.5 10h15v5.6a4 4 0 0 1 -4 4h-7a4 4 0 0 1 -4 -4Z" fill="${SAGE}"/>` +
         `<line x1="3" y1="10" x2="21" y2="10"/><path d="M19.6 12.2a2 2 0 0 1 0 4"/>` +
         `<path d="M9 7.2c.7-.9.6-1.7 0-2.6M12.4 7.2c.7-.9.6-1.7 0-2.6M15.8 7.2c.7-.9.6-1.7 0-2.6"/>`,
    compass: `<circle cx="12" cy="12" r="9.2" fill="${SAGE}"/>` +
             `<polygon points="15.8,8.2 13.6,13.8 8.2,15.8 10.4,10.2" fill="${BONE}"/>`,
    lights: `<path d="M3 6.5Q12 14 21 6.5" stroke="${DUST}"/>` +
            `<circle cx="7.5" cy="10.4" r="2.6" fill="${BONE}"/>` +
            `<circle cx="16.5" cy="10.4" r="2.6" fill="${BONE}"/>` +
            `<circle cx="12" cy="12.6" r="2.6" fill="${BONE}"/>`,
  };
  return open + (shapes[name] || "") + "</svg>";
}

function stars(value) {
  if (value == null || value === "") return '<span class="faint">—</span>';
  const path = "M12 2.4 14.9 8.7l6.8.8-5.1 4.7 1.4 6.8L12 17.6 5.9 21l1.5-6.8-5.1-4.7 6.9-.8L12 2.4Z";
  let out = `<span class="rating" title="${value} of 5">`;
  for (let i = 1; i <= 5; i++) {
    out += `<svg viewBox="0 0 24 24" fill="currentColor" class="${i <= value ? "" : "off"}" aria-hidden="true"><path d="${path}"/></svg>`;
  }
  return out + `<span class="vh">${value} of 5</span></span>`;
}

/* ------------------------------------------------------------------ store -- */

/**
 * Records are {id, kind, data}. Supabase keeps one row per record so two
 * people editing different things never overwrite each other; without it the
 * same shape is kept in localStorage for this browser alone.
 */
const Store = {
  mode: "local",
  ready: false,
  error: "",
  records: new Map(),
  client: null,

  all(kind) {
    const out = [];
    for (const rec of this.records.values()) if (rec.kind === kind) out.push(rec);
    return out;
  },

  get(id) { return this.records.get(id) || null; },

  async init() {
    if (CFG.supabaseUrl && CFG.supabaseAnonKey) {
      try {
        await this.connect();
        this.mode = "shared";
      } catch (err) {
        this.mode = "local";
        this.error = err && err.message ? err.message : "could not reach Supabase";
        this.loadLocal();
      }
    } else {
      this.loadLocal();
    }
    this.ready = true;
  },

  async connect() {
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js");
    if (!window.supabase || !window.supabase.createClient) throw new Error("Supabase library did not load");
    this.client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);

    const { data, error } = await this.client.from("campward").select("id,kind,data");
    if (error) throw new Error(error.message);
    this.records = new Map(data.map((r) => [r.id, r]));

    // Anything either of you changes shows up on the other's screen.
    this.client
      .channel("campward-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "campward" }, () => {
        this.refresh();
      })
      .subscribe();
  },

  async refresh() {
    if (this.mode !== "shared") return;
    const { data, error } = await this.client.from("campward").select("id,kind,data");
    if (error) return;
    this.records = new Map(data.map((r) => [r.id, r]));
    render();
  },

  loadLocal() {
    try {
      const raw = localStorage.getItem("campward.v1");
      const rows = raw ? JSON.parse(raw) : [];
      this.records = new Map(rows.map((r) => [r.id, r]));
    } catch {
      this.records = new Map();
    }
  },

  saveLocal() {
    try {
      localStorage.setItem("campward.v1", JSON.stringify([...this.records.values()]));
    } catch {
      toast("This browser is out of storage space.");
    }
  },

  async put(kind, id, data) {
    const rec = { id: id || uid(), kind, data };
    this.records.set(rec.id, rec);
    render();
    if (this.mode === "shared") {
      const { error } = await this.client.from("campward").upsert(rec);
      if (error) toast("Could not save: " + error.message);
    } else {
      this.saveLocal();
    }
    return rec.id;
  },

  async remove(id) {
    this.records.delete(id);
    render();
    if (this.mode === "shared") {
      const { error } = await this.client.from("campward").delete().eq("id", id);
      if (error) toast("Could not delete: " + error.message);
    } else {
      this.saveLocal();
    }
  },

  async putMany(records) {
    for (const rec of records) this.records.set(rec.id, rec);
    render();
    if (this.mode === "shared") {
      const { error } = await this.client.from("campward").upsert(records);
      if (error) toast("Could not save: " + error.message);
    } else {
      this.saveLocal();
    }
  },
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = src;
    tag.onload = resolve;
    tag.onerror = () => reject(new Error("Could not load " + src));
    document.head.appendChild(tag);
  });
}

/* ------------------------------------------------------------- selectors -- */

const trips = () => Store.all("trip").sort((a, b) => {
  const rank = (r) => (r.data.status === "planned" ? 0 : 1);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  const key = (r) => r.data.start || "9999-12-31";
  return key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;
});

const campsites = () => Store.all("campsite").sort((a, b) =>
  (b.data.visitedOn || b.data.created || "").localeCompare(a.data.visitedOn || a.data.created || ""));

const hikes = () => Store.all("hike").sort((a, b) =>
  (b.data.hikedOn || b.data.created || "").localeCompare(a.data.hikedOn || a.data.created || ""));

const gear = () => Store.all("gear").sort((a, b) =>
  (a.data.category || "").localeCompare(b.data.category || "") ||
  (a.data.name || "").localeCompare(b.data.name || "", undefined, { sensitivity: "base" }));

const forTrip = (kind, tripId) => Store.all(kind).filter((r) => r.data.tripId === tripId);

const tripTitle = (id) => {
  const t = Store.get(id);
  return t && t.kind === "trip" ? t.data.title : null;
};

/* ------------------------------------------------------------- fragments -- */

function ratingField(name, legend, value, low, high) {
  let out = `<fieldset><legend class="label">${esc(legend)}</legend><div class="rating-input">`;
  for (let n = 1; n <= 5; n++) {
    const id = `${name}-${n}`;
    out += `<span><input type="radio" id="${id}" name="${name}" value="${n}"` +
      `${Number(value) === n ? " checked" : ""}><label for="${id}">${n}</label></span>`;
  }
  if (low) out += `<small class="faint" style="margin-left:.4rem">${esc(low)} → ${esc(high)}</small>`;
  return out + "</div></fieldset>";
}

function locationFields(data) {
  const d = data || {};
  return `
    <div class="field">
      <label for="f-location">Where</label>
      <div class="row" style="gap:.5rem;flex-wrap:nowrap">
        <input class="grow" id="f-location" name="location" type="text" value="${esc(d.location || "")}"
               placeholder="Cataloochee Campground, Great Smoky Mountains">
        <button class="btn btn-small" type="button" data-act="geocode">Find</button>
      </div>
      <div id="geo-results"></div>
    </div>
    <div class="field-row">
      <div><label for="f-lat">Latitude</label>
        <input id="f-lat" name="lat" type="text" inputmode="decimal" value="${esc(d.lat ?? "")}" placeholder="35.6532"></div>
      <div><label for="f-lon">Longitude</label>
        <input id="f-lon" name="lon" type="text" inputmode="decimal" value="${esc(d.lon ?? "")}" placeholder="-83.1067"></div>
    </div>`;
}

function emptyBlock(text, cta) {
  return `<div class="empty"><p>${esc(text)}</p>${cta || ""}</div>`;
}

/* ----------------------------------------------------------------- views -- */

const Views = {};

Views.logbook = function () {
  const all = trips();
  const upcoming = all.filter((t) => t.data.status === "planned");
  const past = all.filter((t) => t.data.status !== "planned");
  const next = upcoming[0];
  const sites = campsites(), walks = hikes();

  const totalNights = all.reduce((sum, t) => sum + (nights(t.data.start, t.data.end) || 0), 0);
  const totalMiles = walks.reduce((sum, h) => sum + (Number(h.data.miles) || 0), 0);

  let nextCard;
  if (next) {
    const countdown = daysUntil(next.data.start);
    const when = countdown == null ? "No dates on the calendar yet"
      : countdown > 1 ? countdown + " days out"
      : countdown === 1 ? "Tomorrow!"
      : countdown === 0 ? "Today — go."
      : "Underway";
    nextCard = `<article class="card card-lit stitched">
      <p class="eyebrow" style="margin-bottom:.25rem">Next out</p>
      <h3 style="margin-bottom:.2rem"><a href="#/trip/${esc(next.id)}" style="color:inherit">${esc(next.data.title)}</a></h3>
      <p class="muted" style="margin-bottom:.5rem">${esc(next.data.location || "Location not set yet")}</p>
      <p class="hand" style="margin:0">${esc(when)}</p>
      <p class="muted" style="margin:.35rem 0 0;font-size:.9rem">${esc(fmtRange(next.data.start, next.data.end))}</p>
    </article>`;
  } else {
    nextCard = emptyBlock("No trip on the books.", '<a class="btn btn-small" href="#/trips/new">Plan one</a>');
  }

  return `
    <section class="split" style="margin-top:1.4rem">
      <div>
        <p class="eyebrow">The logbook</p>
        <h1>Everywhere we&rsquo;ve slept outside.</h1>
        <p class="lede">Trips, the sites we stayed at, the hikes we took, and the gear that
        came along. Write it down while it&rsquo;s fresh — you will not remember which site
        had the good creek access next October.</p>
        <div class="row">
          <a class="btn btn-primary" href="#/trips/new">${icon("tent", 17)} Start a trip</a>
          <a class="btn" href="#/gear">Gear closet</a>
        </div>
      </div>
      <div class="stack">
        ${nextCard}
        <div class="tally">
          <div><b>${past.length}</b><small>Trips</small></div>
          <div><b>${totalNights}</b><small>Nights out</small></div>
          <div><b>${Math.round(totalMiles)}</b><small>Trail miles</small></div>
        </div>
      </div>
    </section>

    ${upcoming.length > 1 ? `<section class="section">
      <header class="spread"><h2>On the calendar</h2><a class="crumb" href="#/trips">All trips →</a></header>
      <div class="cards">${upcoming.slice(1).map(tripCard).join("")}</div>
    </section>` : ""}

    <section class="section split">
      <div>
        <header class="spread"><h2>Recent trips</h2><a class="crumb" href="#/trips">All →</a></header>
        ${past.length === 0
          ? emptyBlock("Nothing logged yet. Once a trip is done, mark it complete and it lands here.")
          : `<ul class="entries">${past.slice(0, 5).map((t) => {
              const n = nights(t.data.start, t.data.end);
              return `<li><div class="spread">
                <div><a href="#/trip/${esc(t.id)}"><strong>${esc(t.data.title)}</strong></a>
                  <div class="muted" style="font-size:.9rem">${esc(t.data.location || "—")}</div></div>
                <div style="text-align:right">
                  <div class="faint" style="font-size:.85rem">${esc(fmtRange(t.data.start, t.data.end))}</div>
                  ${n != null ? `<div class="faint" style="font-size:.8rem">${n} ${n === 1 ? "night" : "nights"}</div>` : ""}
                </div></div></li>`;
            }).join("")}</ul>`}
      </div>
      <div class="stack">
        <div class="card card-quiet">
          <header class="spread"><h3 style="margin:0">Latest sites</h3><a class="crumb" style="margin:0" href="#/campsites">All →</a></header>
          ${sites.length === 0 ? `<p class="muted" style="margin:.6rem 0 0;font-size:.9rem">No campsites rated yet.</p>`
            : `<ul class="entries" style="margin-top:.6rem">${sites.slice(0, 4).map((s) =>
                `<li style="padding:.55rem 0"><div class="spread" style="gap:.5rem">
                  <span>${esc(s.data.name)}</span>${stars(s.data.rating)}</div></li>`).join("")}</ul>`}
        </div>
        <div class="card card-quiet">
          <header class="spread"><h3 style="margin:0">Latest hikes</h3><a class="crumb" style="margin:0" href="#/hikes">All →</a></header>
          ${walks.length === 0 ? `<p class="muted" style="margin:.6rem 0 0;font-size:.9rem">No hikes logged yet.</p>`
            : `<ul class="entries" style="margin-top:.6rem">${walks.slice(0, 4).map((h) =>
                `<li style="padding:.55rem 0"><div class="spread" style="gap:.5rem">
                  <span>${esc(h.data.name)}</span>
                  <span class="faint nums" style="font-size:.85rem">${h.data.miles ? esc(h.data.miles) + " mi" : ""}</span>
                </div></li>`).join("")}</ul>`}
        </div>
      </div>
    </section>`;
};

function tripCard(t) {
  const n = nights(t.data.start, t.data.end);
  return `<a class="card stitched" href="#/trip/${esc(t.id)}">
    <p class="eyebrow" style="margin-bottom:.35rem">${esc(fmtRange(t.data.start, t.data.end))}</p>
    <h3 style="margin-bottom:.25rem">${esc(t.data.title)}</h3>
    <p class="muted" style="margin:0 0 .7rem;font-size:.93rem">${esc(t.data.location || "Location not set")}</p>
    <div class="row-tight">
      ${t.data.status === "planned" ? '<span class="tag tag-dusk">Planned</span>' : '<span class="tag tag-moss">Logged</span>'}
      ${n ? `<span class="tag">${n} ${n === 1 ? "night" : "nights"}</span>` : ""}
    </div></a>`;
}

Views.trips = function () {
  const all = trips();
  const upcoming = all.filter((t) => t.data.status === "planned");
  const past = all.filter((t) => t.data.status !== "planned");
  return `
    <header class="spread" style="margin:1.4rem 0 1.4rem">
      <div><p class="eyebrow">Trips</p><h1 style="margin:0">Where we&rsquo;re going, where we&rsquo;ve been</h1></div>
      <a class="btn btn-primary" href="#/trips/new">${icon("tent", 17)} New trip</a>
    </header>
    ${all.length === 0 ? emptyBlock("The logbook is empty. The first entry is the hardest.",
        '<a class="btn btn-small" href="#/trips/new">Start a trip</a>') : ""}
    ${upcoming.length ? `<section><h2>Coming up</h2><div class="cards">${upcoming.map(tripCard).join("")}</div></section>` : ""}
    ${past.length ? `<section class="section"><h2>Logged</h2><div class="cards">${past.map(tripCard).join("")}</div></section>` : ""}`;
};

Views.tripForm = function (id) {
  const rec = id ? Store.get(id) : null;
  const d = rec ? rec.data : {};
  return `
    <a class="crumb" href="${rec ? "#/trip/" + esc(id) : "#/trips"}">← ${rec ? esc(d.title) : "Trips"}</a>
    <h1>${rec ? "Edit trip" : "A new trip"}</h1>
    ${rec ? "" : `<p class="lede" style="margin-bottom:1.5rem">Name and dates are enough to start.
      Everything else — sites, hikes, packing, meals — hangs off the trip once it exists.</p>`}
    <div style="max-width:44rem">
      <form class="card stitched" data-act="saveTrip" data-id="${esc(id || "")}">
        <div class="field">
          <label for="f-title">Trip name</label>
          <input id="f-title" name="title" type="text" required value="${esc(d.title || "")}"
                 placeholder="Long weekend in the Smokies">
        </div>
        ${locationFields(d)}
        <div class="field-row">
          <div><label for="f-start">Arrive</label><input id="f-start" name="start" type="date" value="${esc(d.start || "")}"></div>
          <div><label for="f-end">Leave</label><input id="f-end" name="end" type="date" value="${esc(d.end || "")}"></div>
          <div><label for="f-status">Status</label>
            <select id="f-status" name="status">
              <option value="planned"${d.status !== "completed" ? " selected" : ""}>Planned</option>
              <option value="completed"${d.status === "completed" ? " selected" : ""}>Been there</option>
            </select></div>
        </div>
        <div class="field">
          <label for="f-notes">Notes</label>
          <textarea id="f-notes" name="notes" placeholder="Reservation numbers, who's coming, the plan, what to remember for next time.">${esc(d.notes || "")}</textarea>
        </div>
        <div class="row">
          <button class="btn btn-primary" type="submit">${rec ? "Save trip" : "Start the log"}</button>
          <a class="btn" href="${rec ? "#/trip/" + esc(id) : "#/trips"}">Cancel</a>
        </div>
      </form>
      ${rec ? `<details class="drawer" style="margin-top:1.4rem">
        <summary>Remove this trip</summary>
        <p class="muted" style="font-size:.9rem">Deleting the trip also deletes its meals and packing list.
        Campsites and hikes survive — they simply stop pointing at a trip.</p>
        <button class="btn btn-small" data-act="deleteTrip" data-id="${esc(id)}">Delete “${esc(d.title)}”</button>
      </details>` : ""}
    </div>`;
};

function campsiteForm(rec, tripId) {
  const d = rec ? rec.data : {};
  const opts = trips().map((t) =>
    `<option value="${esc(t.id)}"${d.tripId === t.id ? " selected" : ""}>${esc(t.data.title)}</option>`).join("");
  return `<form data-act="saveCampsite" data-id="${esc(rec ? rec.id : "")}" data-trip="${esc(tripId || "")}">
    <div class="field-row" style="margin-top:.6rem">
      <div><label>Site name</label><input name="name" type="text" required value="${esc(d.name || "")}" placeholder="Cataloochee, site 14"></div>
      <div><label>Site #</label><input name="siteNumber" type="text" value="${esc(d.siteNumber || "")}" placeholder="14"></div>
      <div><label>Stayed</label><input name="visitedOn" type="date" value="${esc(d.visitedOn || "")}"></div>
    </div>
    ${tripId ? "" : `<div class="field"><label>Trip</label><select name="tripId">
        <option value="">Not tied to a trip</option>${opts}</select></div>`}
    <div class="field"><label>Where</label>
      <input name="location" type="text" value="${esc(d.location || "")}" placeholder="Great Smoky Mountains NP"></div>
    ${ratingField("rating", "Rating", d.rating, "wouldn't again", "perfect")}
    <div class="field"><label class="check"><input type="checkbox" name="wouldReturn"${d.wouldReturn ? " checked" : ""}>
      We&rsquo;d stay here again</label></div>
    <div class="field"><label>Notes</label>
      <textarea name="notes" placeholder="Shade, level ground, water access, how close the neighbours were, whether the bear box actually latched.">${esc(d.notes || "")}</textarea></div>
    <button class="btn btn-primary btn-small" type="submit">${rec ? "Save site" : "Add site"}</button>
  </form>`;
}

function hikeForm(rec, tripId) {
  const d = rec ? rec.data : {};
  const opts = trips().map((t) =>
    `<option value="${esc(t.id)}"${d.tripId === t.id ? " selected" : ""}>${esc(t.data.title)}</option>`).join("");
  return `<form data-act="saveHike" data-id="${esc(rec ? rec.id : "")}" data-trip="${esc(tripId || "")}">
    <div class="field-row" style="margin-top:.6rem">
      <div><label>Trail</label><input name="name" type="text" required value="${esc(d.name || "")}" placeholder="Boogerman Loop"></div>
      <div><label>Walked</label><input name="hikedOn" type="date" value="${esc(d.hikedOn || "")}"></div>
    </div>
    ${tripId ? "" : `<div class="field"><label>Trip</label><select name="tripId">
        <option value="">Not tied to a trip</option>${opts}</select></div>`}
    <div class="field-row">
      <div><label>Miles</label><input name="miles" type="number" step="0.1" min="0" value="${esc(d.miles ?? "")}" placeholder="7.4"></div>
      <div><label>Elevation gain (ft)</label><input name="elevation" type="number" step="10" min="0" value="${esc(d.elevation ?? "")}" placeholder="1400"></div>
    </div>
    ${ratingField("difficulty", "Difficulty", d.difficulty, "stroll", "brutal")}
    ${ratingField("views", "Views", d.views, "trees only", "unbelievable")}
    <div class="field"><label class="check"><input type="checkbox" name="wouldRepeat"${d.wouldRepeat ? " checked" : ""}>
      Would do it again</label></div>
    <div class="field"><label>Notes</label>
      <textarea name="notes" placeholder="Trail conditions, water crossings, where the good lunch rock is, what we'd do differently.">${esc(d.notes || "")}</textarea></div>
    <button class="btn btn-primary btn-small" type="submit">${rec ? "Save hike" : "Add hike"}</button>
  </form>`;
}

function gearForm(rec) {
  const d = rec ? rec.data : {};
  return `<form data-act="saveGear" data-id="${esc(rec ? rec.id : "")}">
    <div class="field-row" style="margin-top:.6rem">
      <div style="grid-column:span 2"><label>Item</label>
        <input name="name" type="text" required value="${esc(d.name || "")}" placeholder="Copper Spur UL2"></div>
      <div><label>Category</label><select name="category">
        ${GEAR_CATEGORIES.map((c) => `<option${d.category === c ? " selected" : ""}>${c}</option>`).join("")}</select></div>
    </div>
    <div class="field-row">
      <div><label>Condition</label><select name="condition">
        ${GEAR_CONDITIONS.map(([v, l]) => `<option value="${v}"${(d.condition || "good") === v ? " selected" : ""}>${l}</option>`).join("")}</select></div>
      <div><label>Quantity</label><input name="quantity" type="number" min="1" step="1" value="${esc(d.quantity ?? 1)}"></div>
      <div><label>Weight (oz)</label><input name="weightOz" type="number" min="0" step="0.1" value="${esc(d.weightOz ?? "")}" placeholder="51"></div>
    </div>
    <div class="field"><label>Notes</label>
      <textarea name="notes" style="min-height:3.6rem" placeholder="Where it lives, what needs fixing, what it replaced.">${esc(d.notes || "")}</textarea></div>
    <div class="row">
      <button class="btn btn-primary btn-small" type="submit">${rec ? "Save item" : "Add to the closet"}</button>
      ${rec ? `<button class="btn-plain" type="button" data-act="deleteGear" data-id="${esc(rec.id)}">Delete this item</button>` : ""}
    </div>
  </form>`;
}

/* ----------------------------------------------------------- trip detail -- */

Views.trip = function (id) {
  const rec = Store.get(id);
  if (!rec || rec.kind !== "trip") return Views.missing();
  const d = rec.data;
  const sites = forTrip("campsite", id);
  const walks = forTrip("hike", id);
  const n = nights(d.start, d.end);
  const countdown = d.status === "planned" ? daysUntil(d.start) : null;
  const hasCoords = d.lat != null && d.lon != null && d.lat !== "" && d.lon !== "";
  const miles = walks.reduce((sum, h) => sum + (Number(h.data.miles) || 0), 0);

  const stamp = d.status === "completed" ? '<span class="stamp stamp-moss">Logged</span>'
    : countdown != null && countdown >= 0
      ? `<span class="stamp">${countdown === 0 ? "Today" : countdown + " days out"}</span>`
      : '<span class="stamp">Planned</span>';

  return `
    <a class="crumb" href="#/trips">← Trips</a>
    <header class="spread" style="margin-bottom:1.3rem">
      <div>
        <p class="eyebrow" style="margin-bottom:.3rem">${esc(fmtRange(d.start, d.end))}${n ? ` · ${n} ${n === 1 ? "night" : "nights"}` : ""}</p>
        <h1 style="margin:0">${esc(d.title)}</h1>
        <p class="muted" style="margin:.35rem 0 0">${esc(d.location || coordLabel(d.lat, d.lon) || "Location not set")}</p>
      </div>
      <div class="row-tight">${stamp}<a class="btn btn-small" href="#/trips/${esc(id)}/edit">Edit</a></div>
    </header>

    <div class="split">
      <div>
        ${d.notes ? `<section class="card stitched" style="margin-bottom:1.5rem">
          <p class="eyebrow">Trip notes</p><div class="ruled">${esc(d.notes)}</div></section>` : ""}

        <section class="section" style="${d.notes ? "" : "margin-top:0"}">
          <header class="row-tight" style="margin-bottom:.8rem">${icon("tent")}
            <h2 style="margin:0">Campsites</h2><span class="faint" style="font-size:.85rem">${sites.length}</span></header>
          ${sites.length === 0 ? emptyBlock("No sites recorded for this trip yet.")
            : `<div class="stack-sm">${sites.map((s) => `
              <article class="card">
                <div class="spread">
                  <div><h3 style="margin-bottom:.1rem">${esc(s.data.name)}</h3>
                    <p class="muted" style="margin:0;font-size:.9rem">${esc([
                      s.data.siteNumber ? "Site " + s.data.siteNumber : "", fmtDate(s.data.visitedOn)
                    ].filter(Boolean).join(" · ") || s.data.location || "")}</p></div>
                  ${stars(s.data.rating)}
                </div>
                ${s.data.notes ? `<p class="note" style="margin:.7rem 0 0">${esc(s.data.notes)}</p>` : ""}
                ${s.data.wouldReturn ? '<p class="hand" style="margin:.5rem 0 0">Stay here again.</p>' : ""}
                <details class="drawer" style="margin-top:.5rem"><summary>Edit</summary>
                  ${campsiteForm(s, id)}
                  <button class="btn-plain" data-act="deleteRec" data-id="${esc(s.id)}">Delete this site</button>
                </details>
              </article>`).join("")}</div>`}
          <details class="drawer" style="margin-top:.7rem"><summary>Log a campsite</summary>${campsiteForm(null, id)}</details>
        </section>

        <section class="section">
          <header class="row-tight" style="margin-bottom:.8rem">${icon("peak")}
            <h2 style="margin:0">Hikes</h2>
            <span class="faint nums" style="font-size:.85rem">${walks.length ? walks.length + " · " + miles.toFixed(1) + " mi" : "0"}</span></header>
          ${walks.length === 0 ? emptyBlock("No hikes logged for this trip yet.")
            : `<div class="stack-sm">${walks.map((h) => `
              <article class="card">
                <div class="spread">
                  <div><h3 style="margin-bottom:.1rem">${esc(h.data.name)}</h3>
                    <p class="muted nums" style="margin:0;font-size:.9rem">${esc([
                      h.data.miles ? h.data.miles + " mi" : "",
                      h.data.elevation ? Number(h.data.elevation).toLocaleString() + " ft" : "",
                      fmtDate(h.data.hikedOn)
                    ].filter(Boolean).join(" · "))}</p></div>
                  <div style="text-align:right">
                    <div class="row-tight" style="justify-content:flex-end"><span class="label" style="margin:0">Hard</span>${stars(h.data.difficulty)}</div>
                    <div class="row-tight" style="justify-content:flex-end"><span class="label" style="margin:0">Views</span>${stars(h.data.views)}</div>
                  </div>
                </div>
                ${h.data.notes ? `<p class="note" style="margin:.7rem 0 0">${esc(h.data.notes)}</p>` : ""}
                ${h.data.wouldRepeat ? '<p class="hand" style="margin:.5rem 0 0">Worth repeating.</p>' : ""}
                <details class="drawer" style="margin-top:.5rem"><summary>Edit</summary>
                  ${hikeForm(h, id)}
                  <button class="btn-plain" data-act="deleteRec" data-id="${esc(h.id)}">Delete this hike</button>
                </details>
              </article>`).join("")}</div>`}
          <details class="drawer" style="margin-top:.7rem"><summary>Log a hike</summary>${hikeForm(null, id)}</details>
        </section>

        <section class="section">
          <header class="row-tight" style="margin-bottom:.8rem">${icon("pot")}<h2 style="margin:0">Meals</h2></header>
          ${mealPlanner(id, d.start)}
        </section>
      </div>

      <aside class="stack">
        ${hasCoords ? `<div>
            <div class="map-frame">${mapEmbed(Number(d.lat), Number(d.lon), d.location || d.title)}</div>
            <p class="faint nums" style="margin:.4rem 0 0;font-size:.8rem">${esc(coordLabel(Number(d.lat), Number(d.lon)))} ·
              <a href="https://www.openstreetmap.org/?mlat=${esc(d.lat)}&mlon=${esc(d.lon)}#map=13/${esc(d.lat)}/${esc(d.lon)}"
                 target="_blank" rel="noreferrer">Larger map</a></p>
          </div>`
          : emptyBlock("Add coordinates on the edit page to get a map and the weather forecast.",
              `<a class="btn btn-small" href="#/trips/${esc(id)}/edit">Edit trip</a>`)}

        <section>
          <header class="row-tight" style="margin-bottom:.7rem">${icon("cloud")}<h2 style="margin:0">Conditions</h2></header>
          ${hasCoords ? `<div id="weather" data-lat="${esc(d.lat)}" data-lon="${esc(d.lon)}">
              <div class="card card-quiet row-tight">${icon("cloud")}<span class="muted">Reading the sky…</span></div></div>`
            : `<p class="muted" style="font-size:.92rem">No coordinates, no forecast.</p>`}
        </section>

        <section>
          <header class="row-tight" style="margin-bottom:.7rem">${icon("compass")}<h2 style="margin:0">Bring this trip</h2></header>
          ${packList(id)}
        </section>
      </aside>
    </div>`;
};

function mapEmbed(lat, lon, label) {
  const span = 0.045;
  const bbox = [lon - span, lat - span / 2, lon + span, lat + span / 2].map((n) => n.toFixed(5)).join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)},${lon.toFixed(5)}`;
  return `<iframe src="${esc(src)}" title="Map of ${esc(label || "the trip")}" loading="lazy"></iframe>`;
}

/* ----------------------------------------------------------- packing list -- */

function packList(tripId) {
  const closet = gear().filter((g) => !g.data.retired);
  const packing = new Map(forTrip("packing", tripId).map((p) => [p.data.gearId, p]));
  const onList = closet.filter((g) => packing.has(g.id));
  const available = closet.filter((g) => !packing.has(g.id));
  const packed = onList.filter((g) => packing.get(g.id).data.packed).length;

  const byCategory = {};
  for (const g of onList) (byCategory[g.data.category || "Other"] ||= []).push(g);

  let body;
  if (onList.length === 0) {
    body = emptyBlock("Nothing on the list yet. Pull items out of the closet below.",
      closet.length === 0 ? '<a class="btn btn-small" href="#/gear">Add gear first</a>' : "");
  } else {
    body = `<div class="spread">
        <p class="hand" style="margin:0">${packed} of ${onList.length} in the truck</p>
        ${packed ? `<button class="btn-plain" data-act="resetPacking" data-trip="${esc(tripId)}">Uncheck all</button>` : ""}
      </div>` +
      Object.keys(byCategory).sort().map((cat) => `
        <div><p class="eyebrow" style="margin-bottom:.3rem">${esc(cat)}</p>
        <ul class="checklist">${byCategory[cat].map((g) => {
          const p = packing.get(g.id);
          const on = p.data.packed ? "1" : "0";
          return `<li>
            <button class="tickbox" data-on="${on}" data-act="togglePacked" data-id="${esc(p.id)}"
              aria-label="${p.data.packed ? "Unpack" : "Pack"} ${esc(g.data.name)}">${p.data.packed ? "✓" : ""}</button>
            <span class="grow${p.data.packed ? " done" : ""}">${esc(g.data.name)}${
              g.data.quantity > 1 ? ` <span class="faint">×${esc(g.data.quantity)}</span>` : ""}${
              g.data.condition === "repair" ? ' <span class="tag tag-warn">Needs repair</span>' : ""}</span>
            <button class="btn-plain" data-act="unlist" data-id="${esc(p.id)}"
              aria-label="Remove ${esc(g.data.name)} from the list">×</button>
          </li>`;
        }).join("")}</ul></div>`).join("");
  }

  const closetDrawer = available.length ? `<details class="drawer">
    <summary>Add from the closet (${available.length})</summary>
    <ul class="checklist" style="margin-top:.4rem">${available.map((g) => `<li>
      <button class="btn-plain" data-act="list" data-trip="${esc(tripId)}" data-gear="${esc(g.id)}"
        aria-label="Add ${esc(g.data.name)}">＋</button>
      <span class="grow">${esc(g.data.name)}</span>
      <span class="faint" style="font-size:.8rem">${esc(g.data.category || "")}</span>
    </li>`).join("")}</ul></details>` : "";

  return `<div class="stack">${body}${closetDrawer}</div>`;
}

/* ---------------------------------------------------------- meal planner -- */

function mealPlanner(tripId, startDate) {
  const meals = forTrip("meal", tripId).sort((a, b) => {
    const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
    const dayA = a.data.day || "9999-12-31", dayB = b.data.day || "9999-12-31";
    if (dayA !== dayB) return dayA < dayB ? -1 : 1;
    return (order[a.data.slot] ?? 3) - (order[b.data.slot] ?? 3);
  });
  const items = forTrip("mealitem", tripId);
  const label = Object.fromEntries(MEAL_SLOTS);
  const left = items.filter((i) => !i.data.bought).length;

  const list = meals.length === 0
    ? emptyBlock("No meals planned. Add the dinners first — they're the ones that need real ingredients.")
    : `<div class="stack-sm">${meals.map((m) => {
        const mine = items.filter((i) => i.data.mealId === m.id);
        return `<article class="card card-quiet">
          <div class="spread">
            <div><span class="tag tag-moss">${esc(label[m.data.slot] || m.data.slot)}</span>
              <strong style="margin-left:.3rem">${esc(m.data.name)}</strong>
              ${m.data.day ? `<div class="faint" style="font-size:.82rem">${esc(fmtDate(m.data.day))}</div>` : ""}</div>
            <button class="btn-plain" data-act="deleteRec" data-id="${esc(m.id)}" aria-label="Remove ${esc(m.data.name)}">×</button>
          </div>
          ${m.data.notes ? `<p class="muted" style="margin:.4rem 0 0;font-size:.9rem">${esc(m.data.notes)}</p>` : ""}
          ${mine.length ? `<ul class="checklist" style="margin-top:.5rem">${mine.map((i) => `<li>
              <button class="tickbox" data-on="${i.data.bought ? "1" : "0"}" data-act="toggleItem" data-id="${esc(i.id)}"
                aria-label="${i.data.bought ? "Unmark" : "Mark"} ${esc(i.data.item)} bought">${i.data.bought ? "✓" : ""}</button>
              <span class="grow${i.data.bought ? " done" : ""}">${esc(i.data.item)}${
                i.data.quantity ? ` <span class="faint">— ${esc(i.data.quantity)}</span>` : ""}</span>
              <button class="btn-plain" data-act="deleteRec" data-id="${esc(i.id)}" aria-label="Delete ${esc(i.data.item)}">×</button>
            </li>`).join("")}</ul>` : ""}
          <form class="row" style="margin-top:.5rem;flex-wrap:nowrap" data-act="addItem" data-meal="${esc(m.id)}" data-trip="${esc(tripId)}">
            <input class="grow" name="item" type="text" placeholder="Ingredient" aria-label="Ingredient for ${esc(m.data.name)}">
            <input name="quantity" type="text" placeholder="How much" aria-label="Quantity" style="max-width:8.5rem">
            <button class="btn btn-small" type="submit">Add</button>
          </form>
        </article>`;
      }).join("")}</div>`;

  const shopping = items.length ? `<div class="card">
    <p class="eyebrow" style="margin-bottom:.5rem">Shopping list — ${left} left to buy</p>
    <ul class="checklist">${items.slice().sort((a, b) =>
      (a.data.bought ? 1 : 0) - (b.data.bought ? 1 : 0) ||
      a.data.item.localeCompare(b.data.item)).map((i) => {
        const meal = Store.get(i.data.mealId);
        return `<li>
          <button class="tickbox" data-on="${i.data.bought ? "1" : "0"}" data-act="toggleItem" data-id="${esc(i.id)}"
            aria-label="Toggle ${esc(i.data.item)}">${i.data.bought ? "✓" : ""}</button>
          <span class="grow${i.data.bought ? " done" : ""}">${esc(i.data.item)}${
            i.data.quantity ? ` <span class="faint">— ${esc(i.data.quantity)}</span>` : ""}</span>
          <span class="faint" style="font-size:.78rem">${esc(meal ? meal.data.name : "")}</span>
        </li>`;
      }).join("")}</ul></div>` : "";

  return `<div class="stack">${list}
    <details class="drawer"><summary>Plan a meal</summary>
      <form data-act="addMeal" data-trip="${esc(tripId)}" style="margin-top:.5rem">
        <div class="field-row">
          <div style="grid-column:span 2"><label for="m-name">Meal</label>
            <input id="m-name" name="name" type="text" required placeholder="Chili and cornbread in the dutch oven"></div>
          <div><label for="m-slot">When</label><select id="m-slot" name="slot">
            ${MEAL_SLOTS.map(([v, l]) => `<option value="${v}"${v === "dinner" ? " selected" : ""}>${l}</option>`).join("")}</select></div>
          <div><label for="m-day">Day</label><input id="m-day" name="day" type="date" value="${esc(startDate || "")}"></div>
        </div>
        <div class="field"><label for="m-notes">Notes</label>
          <textarea id="m-notes" name="notes" style="min-height:3.2rem" placeholder="Prep at home, cook time, what pot it needs."></textarea></div>
        <button class="btn btn-primary btn-small" type="submit">Add meal</button>
      </form>
    </details>
    ${shopping}</div>`;
}

/* ------------------------------------------------------------ index views -- */

Views.campsites = function () {
  const all = campsites();
  const rated = all.filter((s) => s.data.rating);
  const avg = rated.length ? (rated.reduce((s, r) => s + Number(r.data.rating), 0) / rated.length).toFixed(1) : null;
  return `
    <header style="margin:1.4rem 0 1.3rem">
      <p class="eyebrow">Campsites</p><h1 style="margin:0">Sites we&rsquo;ve slept at</h1>
      <p class="lede" style="margin-top:.5rem">${all.length === 0
        ? "Rate them while the memory is sharp — the good ones book out early next year."
        : `${all.length} logged${avg ? `, averaging ${avg} out of 5` : ""}.`}</p>
    </header>
    <details class="drawer card card-quiet" style="margin-bottom:1.5rem">
      <summary>Log a campsite</summary>${campsiteForm(null, null)}</details>
    ${all.length === 0 ? emptyBlock("No campsites yet. Add one above, or log one from inside a trip.")
      : `<div class="stack">${all.map((s) => {
          const title = tripTitle(s.data.tripId);
          return `<article class="card">
            <div class="spread">
              <div><h3 style="margin-bottom:.15rem">${esc(s.data.name)}</h3>
                <p class="muted" style="margin:0;font-size:.93rem">${esc(s.data.location || coordLabel(s.data.lat, s.data.lon) || "Location not recorded")}</p></div>
              <div style="text-align:right">${stars(s.data.rating)}
                <div class="faint" style="font-size:.82rem">${esc(fmtDate(s.data.visitedOn))}</div></div>
            </div>
            <div class="row-tight" style="margin-top:.6rem">
              ${s.data.siteNumber ? `<span class="tag">Site ${esc(s.data.siteNumber)}</span>` : ""}
              ${s.data.wouldReturn ? '<span class="tag tag-moss">Would return</span>' : '<span class="tag">Once was enough</span>'}
              ${title ? `<a class="tag tag-dusk" href="#/trip/${esc(s.data.tripId)}">${esc(title)}</a>` : ""}
            </div>
            ${s.data.notes ? `<p class="note" style="margin:.75rem 0 0">${esc(s.data.notes)}</p>` : ""}
            <details class="drawer" style="margin-top:.6rem"><summary>Edit</summary>
              ${campsiteForm(s, null)}
              <button class="btn-plain" data-act="deleteRec" data-id="${esc(s.id)}">Delete this site</button>
            </details>
          </article>`;
        }).join("")}</div>`}`;
};

Views.hikes = function () {
  const all = hikes();
  const miles = all.reduce((s, h) => s + (Number(h.data.miles) || 0), 0);
  const gain = all.reduce((s, h) => s + (Number(h.data.elevation) || 0), 0);
  return `
    <header style="margin:1.4rem 0 1.3rem">
      <p class="eyebrow">Hikes</p><h1 style="margin:0">Trails, walked</h1>
      <p class="lede" style="margin-top:.5rem">${all.length === 0
        ? "Distance, climb, and whether it was worth it."
        : `${all.length} logged — ${miles.toFixed(1)} miles and ${gain.toLocaleString()} feet of climbing.`}</p>
    </header>
    <details class="drawer card card-quiet" style="margin-bottom:1.5rem">
      <summary>Log a hike</summary>${hikeForm(null, null)}</details>
    ${all.length === 0 ? emptyBlock("No hikes yet. Add one above, or log one from inside a trip.")
      : `<div class="stack">${all.map((h) => {
          const title = tripTitle(h.data.tripId);
          return `<article class="card">
            <div class="spread">
              <div><h3 style="margin-bottom:.15rem">${esc(h.data.name)}</h3>
                <p class="muted nums" style="margin:0;font-size:.93rem">${esc([
                  h.data.miles ? h.data.miles + " mi" : "",
                  h.data.elevation ? Number(h.data.elevation).toLocaleString() + " ft gain" : ""
                ].filter(Boolean).join(" · ") || "No distance recorded")}</p></div>
              <div class="faint" style="font-size:.82rem">${esc(fmtDate(h.data.hikedOn))}</div>
            </div>
            <div class="row" style="margin-top:.65rem;gap:1.1rem">
              <span class="row-tight"><span class="label" style="margin:0">Difficulty</span>${stars(h.data.difficulty)}</span>
              <span class="row-tight"><span class="label" style="margin:0">Views</span>${stars(h.data.views)}</span>
            </div>
            <div class="row-tight" style="margin-top:.55rem">
              ${h.data.wouldRepeat ? '<span class="tag tag-moss">Would do again</span>' : '<span class="tag">Been there</span>'}
              ${title ? `<a class="tag tag-dusk" href="#/trip/${esc(h.data.tripId)}">${esc(title)}</a>` : ""}
            </div>
            ${h.data.notes ? `<p class="note" style="margin:.75rem 0 0">${esc(h.data.notes)}</p>` : ""}
            <details class="drawer" style="margin-top:.6rem"><summary>Edit</summary>
              ${hikeForm(h, null)}
              <button class="btn-plain" data-act="deleteRec" data-id="${esc(h.id)}">Delete this hike</button>
            </details>
          </article>`;
        }).join("")}</div>`}`;
};

Views.gear = function () {
  const all = gear();
  const active = all.filter((g) => !g.data.retired);
  const retired = all.filter((g) => g.data.retired);
  const repair = active.filter((g) => g.data.condition === "repair");
  const label = Object.fromEntries(GEAR_CONDITIONS);
  const weight = active.reduce((s, g) => s + (Number(g.data.weightOz) || 0) * (Number(g.data.quantity) || 1), 0);

  const byCategory = {};
  for (const g of active) (byCategory[g.data.category || "Other"] ||= []).push(g);

  const tagClass = (g) => g.data.condition === "repair" ? "tag tag-warn"
    : g.data.condition === "new" ? "tag tag-moss" : "tag";

  return `
    <header style="margin:1.4rem 0 1.3rem">
      <p class="eyebrow">Gear</p><h1 style="margin:0">The closet</h1>
      <p class="lede" style="margin-top:.5rem">${active.length === 0
        ? "Everything you own, so the packing list can build itself."
        : `${active.length} items in rotation${weight ? `, ${(weight / 16).toFixed(1)} lb all told` : ""}.`}</p>
    </header>
    ${repair.length ? `<div class="alert" style="margin-bottom:1.3rem"><p style="margin:0">
      <strong>Needs attention before the next trip:</strong> ${esc(repair.map((g) => g.data.name).join(", "))}.</p></div>` : ""}
    <details class="drawer card card-quiet" style="margin-bottom:1.5rem"><summary>Add gear</summary>${gearForm(null)}</details>
    ${active.length === 0 ? emptyBlock("Nothing in the closet yet. Add the big things first — tent, bags, pads, stove.")
      : Object.keys(byCategory).sort().map((cat) => `
        <section class="section" style="margin-top:1.7rem">
          <header class="row-tight" style="margin-bottom:.7rem">${icon("pack", 19)}
            <h2 style="margin:0">${esc(cat)}</h2><span class="faint" style="font-size:.85rem">${byCategory[cat].length}</span></header>
          <div class="card"><ul class="entries">${byCategory[cat].map((g) => `
            <li><details class="drawer"><summary class="row-summary">
              <span><strong class="row-name">${esc(g.data.name)}</strong>${
                g.data.quantity > 1 ? ` <span class="faint">×${esc(g.data.quantity)}</span>` : ""}${
                g.data.notes ? `<span class="muted" style="display:block;font-size:.89rem">${esc(g.data.notes)}</span>` : ""}</span>
              <span class="row-tight">${g.data.weightOz ? `<span class="faint nums" style="font-size:.84rem">${esc(g.data.weightOz)} oz</span>` : ""}
                <span class="${tagClass(g)}">${esc(label[g.data.condition] || g.data.condition || "Good")}</span></span>
            </summary>${gearForm(g)}</details></li>`).join("")}</ul></div>
        </section>`).join("")}
    ${retired.length ? `<details class="drawer" style="margin-top:1.8rem">
      <summary>Retired gear (${retired.length})</summary>
      <div class="card card-quiet" style="margin-top:.6rem"><ul class="entries">${retired.map((g) => `
        <li><details class="drawer"><summary class="row-summary">
          <span class="muted row-name">${esc(g.data.name)}</span><span class="tag">Retired</span>
        </summary>${gearForm(g)}</details></li>`).join("")}</ul></div></details>` : ""}`;
};

Views.missing = function () {
  return `<div style="margin-top:2.5rem;max-width:34rem">${icon("compass", 42)}
    <h1>Off the map</h1>
    <p class="lede">There&rsquo;s no page here. Probably a trip that got deleted, or a link that went stale.</p>
    <a class="btn btn-primary" href="#/">Back to the logbook</a></div>`;
};

/* --------------------------------------------------------------- weather -- */

/**
 * NO API KEY IS NEEDED for any of this. The National Weather Service covers
 * the US; Open-Meteo picks up everywhere else. Both are open services that
 * allow browser requests directly.
 */
const WMO = { 0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow",
  75: "Heavy snow", 77: "Snow grains", 80: "Rain showers", 81: "Rain showers",
  82: "Violent rain showers", 85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorms", 96: "Thunderstorms with hail", 99: "Thunderstorms with hail" };

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/geo+json, application/json" } });
  if (!res.ok) throw new Error(res.status + " " + res.statusText);
  return res.json();
}

async function fromNws(lat, lon) {
  const coords = lat.toFixed(4) + "," + lon.toFixed(4);
  const points = await getJson("https://api.weather.gov/points/" + coords);
  const url = points.properties && points.properties.forecast;
  if (!url) throw new Error("No NWS forecast grid here");

  const [forecast, alerts] = await Promise.all([
    getJson(url),
    getJson("https://api.weather.gov/alerts/active?point=" + coords).catch(() => ({})),
  ]);
  const near = points.properties.relativeLocation && points.properties.relativeLocation.properties;

  return {
    source: "National Weather Service",
    place: near && near.city ? (near.city + ", " + (near.state || "")).trim() : null,
    periods: ((forecast.properties && forecast.properties.periods) || []).slice(0, 8).map((p) => ({
      name: p.name || "",
      temperature: p.temperature ?? null,
      wind: [p.windSpeed, p.windDirection].filter(Boolean).join(" "),
      shortForecast: p.shortForecast || "",
      detailedForecast: p.detailedForecast || "",
      precip: (p.probabilityOfPrecipitation && p.probabilityOfPrecipitation.value) ?? null,
    })),
    alerts: ((alerts.features) || []).map((f) => ({
      event: (f.properties && f.properties.event) || "Alert",
      severity: (f.properties && f.properties.severity) || "Unknown",
      headline: (f.properties && f.properties.headline) || "",
    })),
  };
}

async function fromOpenMeteo(lat, lon) {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max," +
    "wind_speed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7";
  const data = await getJson(url);
  const daily = data.daily || {};
  return {
    source: "Open-Meteo",
    place: null,
    periods: (daily.time || []).map((day, i) => {
      const high = daily.temperature_2m_max ? daily.temperature_2m_max[i] : null;
      const low = daily.temperature_2m_min ? daily.temperature_2m_min[i] : null;
      const sky = WMO[daily.weather_code ? daily.weather_code[i] : -1] || "Mixed conditions";
      const wind = daily.wind_speed_10m_max ? daily.wind_speed_10m_max[i] : null;
      return {
        name: new Date(day + "T12:00:00").toLocaleDateString(undefined, { weekday: "long" }),
        temperature: high == null ? null : Math.round(high),
        wind: wind ? "up to " + Math.round(wind) + " mph" : "",
        shortForecast: sky,
        detailedForecast: low == null ? sky : sky + ". Overnight low around " + Math.round(low) + "°F.",
        precip: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : null,
      };
    }),
    alerts: [],
  };
}

/** Turns a forecast into the handful of "don't forget…" lines worth acting on. */
function packingHints(f) {
  const hints = [];
  if (!f.periods.length) return hints;
  const temps = f.periods.map((p) => p.temperature).filter((t) => t != null);
  const coldest = temps.length ? Math.min(...temps) : null;
  const hottest = temps.length ? Math.max(...temps) : null;
  const wettest = Math.max(0, ...f.periods.map((p) => p.precip || 0));
  const text = f.periods.map((p) => p.shortForecast + " " + p.detailedForecast).join(" ").toLowerCase();

  if (coldest != null && coldest <= 32)
    hints.push("Freezing temperatures in the forecast — cold-rated bag, insulated pad, and water stored so it can't freeze.");
  else if (coldest != null && coldest <= 45)
    hints.push("Cold nights ahead — pack the warm layer and a hat you can sleep in.");
  if (hottest != null && hottest >= 85)
    hints.push("Hot days — extra water capacity, electrolytes, and shade you can rig.");
  if (wettest >= 50)
    hints.push("Rain likely (" + wettest + "% chance) — rain shells, a tarp over the kitchen, and dry bags for the sleep system.");
  else if (wettest >= 25)
    hints.push("Some chance of rain (" + wettest + "%) — bring the shells even if it looks clear at the trailhead.");
  if (text.includes("thunder")) hints.push("Thunderstorms possible — plan to be off exposed ridges by early afternoon.");
  if (text.includes("snow")) hints.push("Snow in the forecast — traction devices and waterproof boots.");
  if (f.alerts.length) hints.push(f.alerts.length + " active weather alert(s) for this area — read them before you commit.");
  if (!hints.length) hints.push("Nothing alarming in the forecast. Standard kit should do it.");
  return hints;
}

async function loadWeather() {
  const box = document.getElementById("weather");
  if (!box) return;
  const lat = Number(box.dataset.lat), lon = Number(box.dataset.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

  let f;
  try {
    f = await fromNws(lat, lon);
  } catch {
    try { f = await fromOpenMeteo(lat, lon); }
    catch {
      box.innerHTML = `<div class="card card-quiet"><p class="muted" style="margin:0">
        Couldn&rsquo;t reach the weather services just now. Try again in a minute — nothing is
        stored, so a reload is all it takes.</p></div>`;
      return;
    }
  }
  if (!document.getElementById("weather")) return; // navigated away while fetching

  box.innerHTML = `<div class="stack">
    ${f.alerts.map((a) => `<div class="alert">
      <p class="eyebrow" style="margin-bottom:.2rem">${esc(a.severity)} · ${esc(a.event)}</p>
      <p style="margin:0;font-size:.93rem">${esc(a.headline)}</p></div>`).join("")}
    ${f.periods.length === 0 ? '<p class="muted">No forecast available for this spot.</p>'
      : `<div class="forecast">${f.periods.map((p) => `<div class="forecast-day">
          <div class="when">${esc(p.name)}</div>
          <div class="temp">${p.temperature == null ? "—" : esc(p.temperature) + "°"}</div>
          <div class="sky">${esc(p.shortForecast)}</div>
          ${p.precip ? `<div class="faint nums" style="font-size:.78rem;margin-top:.2rem">${esc(p.precip)}% precip</div>` : ""}
          ${p.wind ? `<div class="faint" style="font-size:.78rem">Wind ${esc(p.wind)}</div>` : ""}
        </div>`).join("")}</div>`}
    <div class="card card-quiet">
      <p class="eyebrow" style="margin-bottom:.5rem">What this means for the packing list</p>
      <ul class="checklist">${packingHints(f).map((h) =>
        `<li><span style="color:var(--link)">·</span><span>${esc(h)}</span></li>`).join("")}</ul>
    </div>
    <p class="faint" style="margin:0;font-size:.8rem">Source: ${esc(f.source)}${
      f.place ? " · nearest station " + esc(f.place) : ""}</p>
  </div>`;
}

/* -------------------------------------------------------------- geocoding -- */

/** Address → coordinates via OpenStreetMap's Nominatim. No key required. */
async function geocode(button) {
  const input = document.getElementById("f-location");
  const out = document.getElementById("geo-results");
  const query = input.value.trim();
  if (!query) return;

  button.textContent = "Looking…";
  out.innerHTML = "";
  try {
    const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=" + encodeURIComponent(query);
    const results = await getJson(url);
    if (!results.length) {
      out.innerHTML = `<p class="faint" style="margin:.4rem 0 0;font-size:.85rem">
        Nothing found. Try a nearby town, or put the coordinates in below.</p>`;
    } else {
      out.innerHTML = `<ul class="entries" style="margin-top:.5rem">${results.map((r) => `
        <li style="padding:.4rem 0"><button type="button" class="btn-plain" data-act="pickPlace"
          data-label="${esc(r.display_name)}" data-lat="${esc(r.lat)}" data-lon="${esc(r.lon)}"
          style="text-align:left;text-transform:none;letter-spacing:0;font-size:.88rem;font-weight:400">
          ${esc(r.display_name)}</button></li>`).join("")}</ul>`;
    }
  } catch {
    out.innerHTML = `<p class="faint" style="margin:.4rem 0 0;font-size:.85rem">
      Lookup service is not answering. Coordinates can go in by hand.</p>`;
  }
  button.textContent = "Find";
}

/* --------------------------------------------------------------- actions -- */

function formValues(form) {
  const values = {};
  for (const [key, value] of new FormData(form)) values[key] = typeof value === "string" ? value.trim() : value;
  for (const box of form.querySelectorAll('input[type="checkbox"]')) values[box.name] = box.checked;
  return values;
}

const Actions = {
  async saveTrip(form) {
    const v = formValues(form);
    const id = await Store.put("trip", form.dataset.id || null, {
      title: v.title || "Untitled trip",
      location: v.location || "",
      lat: num(v.lat), lon: num(v.lon),
      start: v.start || null, end: v.end || null,
      status: v.status || "planned",
      notes: v.notes || "",
      created: (Store.get(form.dataset.id) || {}).data?.created || new Date().toISOString(),
    });
    location.hash = "#/trip/" + id;
  },

  async deleteTrip(el) {
    const id = el.dataset.id;
    if (!confirm("Delete this trip? Its meals and packing list go too.")) return;
    for (const rec of Store.all("meal").concat(Store.all("mealitem"), Store.all("packing"))) {
      if (rec.data.tripId === id) await Store.remove(rec.id);
    }
    for (const rec of Store.all("campsite").concat(Store.all("hike"))) {
      if (rec.data.tripId === id) await Store.put(rec.kind, rec.id, Object.assign({}, rec.data, { tripId: null }));
    }
    await Store.remove(id);
    location.hash = "#/trips";
  },

  async saveCampsite(form) {
    const v = formValues(form);
    await Store.put("campsite", form.dataset.id || null, {
      tripId: form.dataset.trip || v.tripId || null,
      name: v.name || "Unnamed site",
      siteNumber: v.siteNumber || "",
      location: v.location || "",
      visitedOn: v.visitedOn || null,
      rating: num(v.rating),
      wouldReturn: !!v.wouldReturn,
      notes: v.notes || "",
      created: new Date().toISOString(),
    });
    toast("Campsite saved");
  },

  async saveHike(form) {
    const v = formValues(form);
    await Store.put("hike", form.dataset.id || null, {
      tripId: form.dataset.trip || v.tripId || null,
      name: v.name || "Unnamed hike",
      hikedOn: v.hikedOn || null,
      miles: num(v.miles), elevation: num(v.elevation),
      difficulty: num(v.difficulty), views: num(v.views),
      wouldRepeat: !!v.wouldRepeat,
      notes: v.notes || "",
      created: new Date().toISOString(),
    });
    toast("Hike saved");
  },

  async saveGear(form) {
    const v = formValues(form);
    await Store.put("gear", form.dataset.id || null, {
      name: v.name || "Unnamed item",
      category: v.category || "Other",
      condition: v.condition || "good",
      quantity: num(v.quantity) || 1,
      weightOz: num(v.weightOz),
      // "Retired" in the dropdown and the retired flag must not drift apart.
      retired: v.condition === "retired",
      notes: v.notes || "",
      created: new Date().toISOString(),
    });
    toast("Gear saved");
  },

  async deleteGear(el) {
    if (!confirm("Delete this item from the closet?")) return;
    for (const p of Store.all("packing")) if (p.data.gearId === el.dataset.id) await Store.remove(p.id);
    await Store.remove(el.dataset.id);
  },

  async deleteRec(el) { await Store.remove(el.dataset.id); },

  async list(el) {
    await Store.put("packing", el.dataset.trip + "__" + el.dataset.gear,
      { tripId: el.dataset.trip, gearId: el.dataset.gear, packed: false });
  },

  async unlist(el) { await Store.remove(el.dataset.id); },

  async togglePacked(el) {
    const rec = Store.get(el.dataset.id);
    if (rec) await Store.put("packing", rec.id, Object.assign({}, rec.data, { packed: !rec.data.packed }));
  },

  async resetPacking(el) {
    const changed = forTrip("packing", el.dataset.trip)
      .filter((p) => p.data.packed)
      .map((p) => ({ id: p.id, kind: "packing", data: Object.assign({}, p.data, { packed: false }) }));
    if (changed.length) await Store.putMany(changed);
  },

  async addMeal(form) {
    const v = formValues(form);
    await Store.put("meal", null, {
      tripId: form.dataset.trip,
      day: v.day || null,
      slot: v.slot || "dinner",
      name: v.name || "Untitled meal",
      notes: v.notes || "",
      created: new Date().toISOString(),
    });
    form.reset();
  },

  async addItem(form) {
    const v = formValues(form);
    if (!v.item) return;
    await Store.put("mealitem", null, {
      mealId: form.dataset.meal, tripId: form.dataset.trip,
      item: v.item, quantity: v.quantity || "", bought: false,
      created: new Date().toISOString(),
    });
    form.reset();
  },

  async toggleItem(el) {
    const rec = Store.get(el.dataset.id);
    if (rec) await Store.put("mealitem", rec.id, Object.assign({}, rec.data, { bought: !rec.data.bought }));
  },

  pickPlace(el) {
    document.getElementById("f-location").value = el.dataset.label;
    document.getElementById("f-lat").value = Number(el.dataset.lat).toFixed(6);
    document.getElementById("f-lon").value = Number(el.dataset.lon).toFixed(6);
    document.getElementById("geo-results").innerHTML = "";
  },

  geocode(el) { geocode(el); },
};

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-act]");
  if (!el || el.tagName === "FORM") return;
  const fn = Actions[el.dataset.act];
  if (!fn) return;
  event.preventDefault();
  fn(el);
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-act]");
  if (!form) return;
  event.preventDefault();
  const fn = Actions[form.dataset.act];
  if (fn) fn(form);
});

/* ---------------------------------------------------------------- router -- */

const NAV = [["#/", "Logbook"], ["#/trips", "Trips"], ["#/campsites", "Campsites"],
  ["#/hikes", "Hikes"], ["#/gear", "Gear"]];

function currentRoute() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);
  if (parts.length === 0) return { view: "logbook" };
  if (parts[0] === "trips" && parts[1] === "new") return { view: "tripForm" };
  if (parts[0] === "trips" && parts[2] === "edit") return { view: "tripForm", id: parts[1] };
  if (parts[0] === "trips") return { view: "trips" };
  if (parts[0] === "trip" && parts[1]) return { view: "trip", id: parts[1] };
  if (["campsites", "hikes", "gear"].includes(parts[0])) return { view: parts[0] };
  return { view: "missing" };
}

/** Keeps open drawers open across a re-render, so saving doesn't collapse the
    section you were working in. */
function openDrawerKeys() {
  const keys = new Set();
  document.querySelectorAll("details.drawer[open]").forEach((d) => {
    const summary = d.querySelector("summary");
    if (summary) keys.add(summary.textContent.trim());
  });
  return keys;
}

function render() {
  if (!Store.ready) return;
  const route = currentRoute();
  const open = openDrawerKeys();
  const view = Views[route.view] || Views.missing;

  const active = route.view === "logbook" ? "#/" :
    route.view === "trip" || route.view === "tripForm" ? "#/trips" : "#/" + route.view;
  $("#trail").innerHTML = NAV.map(([href, label]) =>
    `<a href="${href}"${href === active ? ' aria-current="page"' : ""}>${label}</a>`).join("");

  $("#view").innerHTML = view(route.id);

  document.querySelectorAll("details.drawer").forEach((d) => {
    const summary = d.querySelector("summary");
    if (summary && open.has(summary.textContent.trim())) d.open = true;
  });

  document.title = route.view === "logbook" ? "Campward — field logbook"
    : route.view === "trip" && tripTitle(route.id) ? tripTitle(route.id) + " — Campward"
    : "Campward — field logbook";

  loadWeather();
}

function renderBanner() {
  const banner = $("#banner");
  if (Store.mode === "shared") { banner.hidden = true; return; }
  banner.hidden = false;
  banner.innerHTML = `<span class="dot" data-state="local"></span>
    <span>${Store.error
      ? "Couldn&rsquo;t reach the shared logbook (" + esc(Store.error) + "), so this is saving to this browser only."
      : "Saving to this browser only — entries here won&rsquo;t reach your other devices or anyone else."}
    <a href="https://github.com/sarahhouchens-cpu/Campward/blob/main/docs/SETUP.md" target="_blank" rel="noreferrer">How to share one logbook</a></span>`;
}

window.addEventListener("hashchange", render);

(async function start() {
  await Store.init();
  renderBanner();
  render();
})();

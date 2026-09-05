import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

/**
 * Campward keeps everything in a single SQLite file so the whole logbook is one
 * portable artifact you can copy to a thumb drive. Node 22 ships SQLite in core,
 * so there is nothing to compile and no database server to run.
 *
 * Override the location with CAMPWARD_DB_PATH if you keep the logbook in a
 * synced folder (Dropbox, iCloud, a NAS share).
 */
const DB_PATH =
  process.env.CAMPWARD_DB_PATH ?? path.join(process.cwd(), "data", "campward.db");

declare global {
  // Next reloads modules on every edit in dev; hang the handle off globalThis so
  // we don't leak a file descriptor per save.
  var __campwardDb: DatabaseSync | undefined;
}

function connect(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  migrate(database);
  return database;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS trips (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  location      TEXT    NOT NULL DEFAULT '',
  latitude      REAL,
  longitude     REAL,
  start_date    TEXT,
  end_date      TEXT,
  status        TEXT    NOT NULL DEFAULT 'planned',
  notes         TEXT    NOT NULL DEFAULT '',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campsites (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id       INTEGER REFERENCES trips(id) ON DELETE SET NULL,
  name          TEXT    NOT NULL,
  location      TEXT    NOT NULL DEFAULT '',
  latitude      REAL,
  longitude     REAL,
  visited_on    TEXT,
  rating        INTEGER,
  site_number   TEXT    NOT NULL DEFAULT '',
  would_return  INTEGER NOT NULL DEFAULT 0,
  notes         TEXT    NOT NULL DEFAULT '',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hikes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id        INTEGER REFERENCES trips(id) ON DELETE SET NULL,
  name           TEXT    NOT NULL,
  hiked_on       TEXT,
  distance_miles REAL,
  elevation_ft   INTEGER,
  difficulty     INTEGER,
  views          INTEGER,
  would_repeat   INTEGER NOT NULL DEFAULT 0,
  notes          TEXT    NOT NULL DEFAULT '',
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gear (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  category     TEXT    NOT NULL DEFAULT 'Other',
  condition    TEXT    NOT NULL DEFAULT 'good',
  quantity     INTEGER NOT NULL DEFAULT 1,
  weight_oz    REAL,
  retired      INTEGER NOT NULL DEFAULT 0,
  notes        TEXT    NOT NULL DEFAULT '',
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- The "bring this trip" checklist: one row per piece of gear per trip.
CREATE TABLE IF NOT EXISTS trip_gear (
  trip_id  INTEGER NOT NULL REFERENCES trips(id)  ON DELETE CASCADE,
  gear_id  INTEGER NOT NULL REFERENCES gear(id)   ON DELETE CASCADE,
  packed   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (trip_id, gear_id)
);

CREATE TABLE IF NOT EXISTS meals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id    INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day        TEXT,
  slot       TEXT    NOT NULL DEFAULT 'dinner',
  name       TEXT    NOT NULL,
  notes      TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Ingredients roll up into the trip's shopping list.
CREATE TABLE IF NOT EXISTS meal_items (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_id  INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  item     TEXT    NOT NULL,
  quantity TEXT    NOT NULL DEFAULT '',
  packed   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_campsites_trip ON campsites(trip_id);
CREATE INDEX IF NOT EXISTS idx_hikes_trip     ON hikes(trip_id);
CREATE INDEX IF NOT EXISTS idx_meals_trip     ON meals(trip_id);
CREATE INDEX IF NOT EXISTS idx_meal_items     ON meal_items(meal_id);
`;

function migrate(database: DatabaseSync) {
  database.exec(SCHEMA);
}

export function db(): DatabaseSync {
  if (!globalThis.__campwardDb) globalThis.__campwardDb = connect();
  return globalThis.__campwardDb;
}

/** Rows come back as plain objects; this keeps the call sites tidy. */
export function all<T>(sql: string, ...params: unknown[]): T[] {
  return db()
    .prepare(sql)
    .all(...(params as never[])) as T[];
}

export function one<T>(sql: string, ...params: unknown[]): T | undefined {
  return db()
    .prepare(sql)
    .get(...(params as never[])) as T | undefined;
}

export function run(sql: string, ...params: unknown[]) {
  return db()
    .prepare(sql)
    .run(...(params as never[]));
}

/**
 * Starter gear closet — the things almost every trip needs, so the packing list
 * has something to work with on day one. Safe to run more than once: it only
 * adds items whose names aren't already in the closet.
 *
 *   npm run seed
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_PATH =
  process.env.CAMPWARD_DB_PATH ?? path.join(process.cwd(), "data", "campward.db");

const STARTER_GEAR = [
  ["Tent", "Shelter", 1, 96],
  ["Footprint", "Shelter", 1, 8],
  ["Tarp + guylines", "Shelter", 1, 14],
  ["Sleeping bags", "Sleep", 2, 40],
  ["Sleeping pads", "Sleep", 2, 18],
  ["Camp pillows", "Sleep", 2, 6],
  ["Camp stove", "Kitchen", 1, 22],
  ["Fuel canister", "Kitchen", 2, 8],
  ["Cook pot + lid", "Kitchen", 1, 12],
  ["Skillet", "Kitchen", 1, 24],
  ["Mess kit", "Kitchen", 2, 9],
  ["Camp coffee setup", "Kitchen", 1, 10],
  ["Cooler", "Kitchen", 1, 160],
  ["Water jug", "Water", 1, 40],
  ["Water filter", "Water", 1, 11],
  ["Water bottles", "Water", 2, 5],
  ["Rain shells", "Clothing", 2, 12],
  ["Insulating layer", "Clothing", 2, 14],
  ["Camp shoes", "Clothing", 2, 20],
  ["Headlamps", "Light", 2, 3],
  ["Lantern", "Light", 1, 12],
  ["Map + compass", "Navigation", 1, 4],
  ["First aid kit", "Safety", 1, 16],
  ["Fire starter", "Safety", 1, 3],
  ["Camp chairs", "Camp Comfort", 2, 32],
  ["Camp table", "Camp Comfort", 1, 80],
];

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);

const hasGearTable = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='gear'")
  .get();

if (!hasGearTable) {
  console.error(
    "No gear table yet. Start the app once (npm run dev) so the schema is created, then run this again.",
  );
  process.exit(1);
}

const exists = db.prepare("SELECT 1 FROM gear WHERE name = ? COLLATE NOCASE");
const insert = db.prepare(
  "INSERT INTO gear (name, category, condition, quantity, weight_oz) VALUES (?, ?, 'good', ?, ?)",
);

let added = 0;
for (const [name, category, quantity, weight] of STARTER_GEAR) {
  if (!exists.get(name)) {
    insert.run(name, category, quantity, weight);
    added += 1;
  }
}

console.log(
  added === 0
    ? "Closet already stocked — nothing added."
    : `Added ${added} starter items to the gear closet.`,
);
db.close();

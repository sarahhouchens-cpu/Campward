import { all, one } from "./db";
import type {
  Campsite,
  Gear,
  Hike,
  Meal,
  MealItem,
  PackListEntry,
  Trip,
} from "./types";

/* ---------------------------------------------------------------- trips -- */

export function listTrips(): Trip[] {
  // Upcoming and undated trips float to the top; finished ones fall below,
  // most recent first — the way you'd flip through a logbook.
  return all<Trip>(`
    SELECT * FROM trips
    ORDER BY
      CASE status WHEN 'planned' THEN 0 ELSE 1 END,
      COALESCE(start_date, '9999-12-31') ASC,
      id DESC
  `);
}

export function getTrip(id: number): Trip | undefined {
  return one<Trip>("SELECT * FROM trips WHERE id = ?", id);
}

export function tripCounts(id: number) {
  return one<{ campsites: number; hikes: number; meals: number; gear: number }>(
    `SELECT
       (SELECT COUNT(*) FROM campsites WHERE trip_id = ?1) AS campsites,
       (SELECT COUNT(*) FROM hikes     WHERE trip_id = ?1) AS hikes,
       (SELECT COUNT(*) FROM meals     WHERE trip_id = ?1) AS meals,
       (SELECT COUNT(*) FROM trip_gear WHERE trip_id = ?1) AS gear`,
    id,
  )!;
}

/* ------------------------------------------------------------ campsites -- */

export function listCampsites(): (Campsite & { trip_title: string | null })[] {
  return all(`
    SELECT c.*, t.title AS trip_title
    FROM campsites c LEFT JOIN trips t ON t.id = c.trip_id
    ORDER BY COALESCE(c.visited_on, c.created_at) DESC, c.id DESC
  `);
}

export function campsitesForTrip(tripId: number): Campsite[] {
  return all<Campsite>(
    "SELECT * FROM campsites WHERE trip_id = ? ORDER BY COALESCE(visited_on, created_at), id",
    tripId,
  );
}

export function getCampsite(id: number): Campsite | undefined {
  return one<Campsite>("SELECT * FROM campsites WHERE id = ?", id);
}

/* ---------------------------------------------------------------- hikes -- */

export function listHikes(): (Hike & { trip_title: string | null })[] {
  return all(`
    SELECT h.*, t.title AS trip_title
    FROM hikes h LEFT JOIN trips t ON t.id = h.trip_id
    ORDER BY COALESCE(h.hiked_on, h.created_at) DESC, h.id DESC
  `);
}

export function hikesForTrip(tripId: number): Hike[] {
  return all<Hike>(
    "SELECT * FROM hikes WHERE trip_id = ? ORDER BY COALESCE(hiked_on, created_at), id",
    tripId,
  );
}

export function getHike(id: number): Hike | undefined {
  return one<Hike>("SELECT * FROM hikes WHERE id = ?", id);
}

/* ----------------------------------------------------------------- gear -- */

export function listGear(includeRetired = true): Gear[] {
  return all<Gear>(`
    SELECT * FROM gear
    ${includeRetired ? "" : "WHERE retired = 0"}
    ORDER BY retired ASC, category ASC, name COLLATE NOCASE ASC
  `);
}

export function getGear(id: number): Gear | undefined {
  return one<Gear>("SELECT * FROM gear WHERE id = ?", id);
}

/**
 * Every non-retired item, annotated with whether it is on this trip's list and
 * whether it has been packed. One query keeps the checklist a single render.
 */
export function packList(tripId: number): PackListEntry[] {
  return all<PackListEntry>(
    `SELECT g.*, tg.packed AS packed,
            CASE WHEN tg.trip_id IS NULL THEN 0 ELSE 1 END AS on_list
     FROM gear g
     LEFT JOIN trip_gear tg ON tg.gear_id = g.id AND tg.trip_id = ?
     WHERE g.retired = 0
     ORDER BY g.category ASC, g.name COLLATE NOCASE ASC`,
    tripId,
  );
}

/* ---------------------------------------------------------------- meals -- */

export function mealsForTrip(tripId: number): (Meal & { items: MealItem[] })[] {
  const meals = all<Meal>(
    `SELECT * FROM meals WHERE trip_id = ?
     ORDER BY COALESCE(day, '9999-12-31') ASC,
       CASE slot WHEN 'breakfast' THEN 0 WHEN 'lunch' THEN 1
                 WHEN 'dinner' THEN 2 ELSE 3 END,
       id ASC`,
    tripId,
  );
  if (meals.length === 0) return [];

  const items = all<MealItem>(
    `SELECT mi.* FROM meal_items mi
     JOIN meals m ON m.id = mi.meal_id
     WHERE m.trip_id = ? ORDER BY mi.id`,
    tripId,
  );

  return meals.map((meal) => ({
    ...meal,
    items: items.filter((i) => i.meal_id === meal.id),
  }));
}

/** Flat ingredient list across the whole trip, for the shopping run. */
export function shoppingList(tripId: number) {
  return all<MealItem & { meal_name: string }>(
    `SELECT mi.*, m.name AS meal_name
     FROM meal_items mi JOIN meals m ON m.id = mi.meal_id
     WHERE m.trip_id = ?
     ORDER BY mi.packed ASC, mi.item COLLATE NOCASE ASC`,
    tripId,
  );
}

/* -------------------------------------------------------------- summary -- */

export function logbookSummary() {
  return one<{
    trips: number;
    nights: number;
    campsites: number;
    hikes: number;
    miles: number;
    gear: number;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM trips WHERE status = 'completed') AS trips,
      (SELECT COALESCE(SUM(MAX(julianday(end_date) - julianday(start_date), 0)), 0)
         FROM trips WHERE start_date IS NOT NULL AND end_date IS NOT NULL) AS nights,
      (SELECT COUNT(*) FROM campsites) AS campsites,
      (SELECT COUNT(*) FROM hikes) AS hikes,
      (SELECT COALESCE(SUM(distance_miles), 0) FROM hikes) AS miles,
      (SELECT COUNT(*) FROM gear WHERE retired = 0) AS gear
  `)!;
}

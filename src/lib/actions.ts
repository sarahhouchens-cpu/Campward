"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { run } from "./db";

/* ------------------------------------------------------- form coercion -- */

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function nullableStr(form: FormData, key: string): string | null {
  const value = str(form, key);
  return value === "" ? null : value;
}

function num(form: FormData, key: string): number | null {
  const value = str(form, key);
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function int(form: FormData, key: string): number | null {
  const value = num(form, key);
  return value == null ? null : Math.round(value);
}

function bool(form: FormData, key: string): number {
  return form.get(key) ? 1 : 0;
}

function refreshTrip(tripId: number | null) {
  revalidatePath("/");
  revalidatePath("/trips");
  if (tripId) revalidatePath(`/trips/${tripId}`);
}

/* ---------------------------------------------------------------- trips -- */

export async function createTrip(form: FormData) {
  const title = str(form, "title") || "Untitled trip";
  const result = run(
    `INSERT INTO trips (title, location, latitude, longitude, start_date, end_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    title,
    str(form, "location"),
    num(form, "latitude"),
    num(form, "longitude"),
    nullableStr(form, "start_date"),
    nullableStr(form, "end_date"),
    str(form, "status") || "planned",
    str(form, "notes"),
  );
  revalidatePath("/");
  revalidatePath("/trips");
  redirect(`/trips/${result.lastInsertRowid}`);
}

export async function updateTrip(form: FormData) {
  const id = Number(form.get("id"));
  run(
    `UPDATE trips SET title = ?, location = ?, latitude = ?, longitude = ?,
       start_date = ?, end_date = ?, status = ?, notes = ? WHERE id = ?`,
    str(form, "title") || "Untitled trip",
    str(form, "location"),
    num(form, "latitude"),
    num(form, "longitude"),
    nullableStr(form, "start_date"),
    nullableStr(form, "end_date"),
    str(form, "status") || "planned",
    str(form, "notes"),
    id,
  );
  refreshTrip(id);
  redirect(`/trips/${id}`);
}

export async function deleteTrip(form: FormData) {
  run("DELETE FROM trips WHERE id = ?", Number(form.get("id")));
  revalidatePath("/");
  revalidatePath("/trips");
  redirect("/trips");
}

/* ------------------------------------------------------------ campsites -- */

export async function saveCampsite(form: FormData) {
  const id = Number(form.get("id")) || null;
  const tripId = int(form, "trip_id");
  const values = [
    tripId,
    str(form, "name") || "Unnamed site",
    str(form, "location"),
    num(form, "latitude"),
    num(form, "longitude"),
    nullableStr(form, "visited_on"),
    int(form, "rating"),
    str(form, "site_number"),
    bool(form, "would_return"),
    str(form, "notes"),
  ];

  if (id) {
    run(
      `UPDATE campsites SET trip_id = ?, name = ?, location = ?, latitude = ?, longitude = ?,
         visited_on = ?, rating = ?, site_number = ?, would_return = ?, notes = ? WHERE id = ?`,
      ...values,
      id,
    );
  } else {
    run(
      `INSERT INTO campsites
         (trip_id, name, location, latitude, longitude, visited_on, rating, site_number, would_return, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ...values,
    );
  }
  revalidatePath("/campsites");
  refreshTrip(tripId);
}

export async function deleteCampsite(form: FormData) {
  run("DELETE FROM campsites WHERE id = ?", Number(form.get("id")));
  revalidatePath("/campsites");
  refreshTrip(int(form, "trip_id"));
}

/* ---------------------------------------------------------------- hikes -- */

export async function saveHike(form: FormData) {
  const id = Number(form.get("id")) || null;
  const tripId = int(form, "trip_id");
  const values = [
    tripId,
    str(form, "name") || "Unnamed hike",
    nullableStr(form, "hiked_on"),
    num(form, "distance_miles"),
    int(form, "elevation_ft"),
    int(form, "difficulty"),
    int(form, "views"),
    bool(form, "would_repeat"),
    str(form, "notes"),
  ];

  if (id) {
    run(
      `UPDATE hikes SET trip_id = ?, name = ?, hiked_on = ?, distance_miles = ?,
         elevation_ft = ?, difficulty = ?, views = ?, would_repeat = ?, notes = ? WHERE id = ?`,
      ...values,
      id,
    );
  } else {
    run(
      `INSERT INTO hikes
         (trip_id, name, hiked_on, distance_miles, elevation_ft, difficulty, views, would_repeat, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ...values,
    );
  }
  revalidatePath("/hikes");
  refreshTrip(tripId);
}

export async function deleteHike(form: FormData) {
  run("DELETE FROM hikes WHERE id = ?", Number(form.get("id")));
  revalidatePath("/hikes");
  refreshTrip(int(form, "trip_id"));
}

/* ----------------------------------------------------------------- gear -- */

export async function saveGear(form: FormData) {
  const id = Number(form.get("id")) || null;
  const condition = str(form, "condition") || "good";
  const values = [
    str(form, "name") || "Unnamed item",
    str(form, "category") || "Other",
    condition,
    int(form, "quantity") ?? 1,
    num(form, "weight_oz"),
    // Marking something "Retired" in the dropdown is the same intent as the
    // retired flag — keep the two from drifting apart.
    condition === "retired" ? 1 : bool(form, "retired"),
    str(form, "notes"),
  ];

  if (id) {
    run(
      `UPDATE gear SET name = ?, category = ?, condition = ?, quantity = ?,
         weight_oz = ?, retired = ?, notes = ? WHERE id = ?`,
      ...values,
      id,
    );
  } else {
    run(
      `INSERT INTO gear (name, category, condition, quantity, weight_oz, retired, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ...values,
    );
  }
  revalidatePath("/gear");
  revalidatePath("/trips");
}

export async function deleteGear(form: FormData) {
  run("DELETE FROM gear WHERE id = ?", Number(form.get("id")));
  revalidatePath("/gear");
  revalidatePath("/trips");
}

/* ------------------------------------------------------- packing list -- */

export async function toggleGearOnTrip(form: FormData) {
  const tripId = Number(form.get("trip_id"));
  const gearId = Number(form.get("gear_id"));
  const onList = form.get("on_list") === "1";

  if (onList) {
    run("DELETE FROM trip_gear WHERE trip_id = ? AND gear_id = ?", tripId, gearId);
  } else {
    run(
      "INSERT OR IGNORE INTO trip_gear (trip_id, gear_id, packed) VALUES (?, ?, 0)",
      tripId,
      gearId,
    );
  }
  revalidatePath(`/trips/${tripId}`);
}

export async function togglePacked(form: FormData) {
  const tripId = Number(form.get("trip_id"));
  run(
    "UPDATE trip_gear SET packed = 1 - packed WHERE trip_id = ? AND gear_id = ?",
    tripId,
    Number(form.get("gear_id")),
  );
  revalidatePath(`/trips/${tripId}`);
}

export async function resetPacking(form: FormData) {
  const tripId = Number(form.get("trip_id"));
  run("UPDATE trip_gear SET packed = 0 WHERE trip_id = ?", tripId);
  revalidatePath(`/trips/${tripId}`);
}

/* ---------------------------------------------------------------- meals -- */

export async function addMeal(form: FormData) {
  const tripId = Number(form.get("trip_id"));
  run(
    "INSERT INTO meals (trip_id, day, slot, name, notes) VALUES (?, ?, ?, ?, ?)",
    tripId,
    nullableStr(form, "day"),
    str(form, "slot") || "dinner",
    str(form, "name") || "Untitled meal",
    str(form, "notes"),
  );
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteMeal(form: FormData) {
  run("DELETE FROM meals WHERE id = ?", Number(form.get("id")));
  revalidatePath(`/trips/${form.get("trip_id")}`);
}

export async function addMealItem(form: FormData) {
  const item = str(form, "item");
  if (item) {
    run(
      "INSERT INTO meal_items (meal_id, item, quantity) VALUES (?, ?, ?)",
      Number(form.get("meal_id")),
      item,
      str(form, "quantity"),
    );
  }
  revalidatePath(`/trips/${form.get("trip_id")}`);
}

export async function toggleMealItem(form: FormData) {
  run("UPDATE meal_items SET packed = 1 - packed WHERE id = ?", Number(form.get("id")));
  revalidatePath(`/trips/${form.get("trip_id")}`);
}

export async function deleteMealItem(form: FormData) {
  run("DELETE FROM meal_items WHERE id = ?", Number(form.get("id")));
  revalidatePath(`/trips/${form.get("trip_id")}`);
}

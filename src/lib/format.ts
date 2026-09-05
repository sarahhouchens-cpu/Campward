/** Small formatting helpers shared by the pages. Dates are stored as ISO YYYY-MM-DD. */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "Aug 3–7, 2025" when the range shares a month, otherwise spelled out. */
export function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Dates not set";
  if (!start) return `Until ${formatDate(end)}`;
  if (!end || end === start) return formatDate(start);

  const [sy, sm, sd] = start.slice(0, 10).split("-").map(Number);
  const [ey, em, ed] = end.slice(0, 10).split("-").map(Number);
  if (sy === ey && sm === em) return `${MONTHS[sm - 1]} ${sd}–${ed}, ${sy}`;
  if (sy === ey) return `${MONTHS[sm - 1]} ${sd} – ${MONTHS[em - 1]} ${ed}, ${sy}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function nightsBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Days until a trip starts. Negative once it's behind us. */
export function daysUntil(start: string | null): number | null {
  if (!start) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const target = Date.parse(`${start}T00:00:00Z`);
  if (Number.isNaN(target)) return null;
  return Math.round((target - todayUtc) / 86_400_000);
}

export function coordLabel(lat: number | null, lon: number | null): string {
  if (lat == null || lon == null) return "";
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`;
}

/**
 * Weather services only see about a week ahead, so for a trip further off than
 * this a forecast would describe a completely different stretch of weather.
 * Showing it anyway — and deriving packing hints from it — is worse than
 * showing nothing.
 */
export const FORECAST_HORIZON_DAYS = 10;

export type ForecastWindow =
  | { show: true; covers: boolean }
  | { show: false; reason: "past" }
  | { show: false; reason: "far"; startsIn: number; checkBack: string | null };

/** Whether a forecast is worth showing for a trip, and why not when it isn't. */
export function forecastWindow(start: string | null, end: string | null): ForecastWindow {
  const startsIn = daysUntil(start);
  const endsIn = daysUntil(end ?? start);
  // Undated: no dates to be wrong about, and current conditions still say
  // something useful about the place.
  if (startsIn == null) return { show: true, covers: true };
  if (endsIn != null && endsIn < 0) return { show: false, reason: "past" };
  if (startsIn > FORECAST_HORIZON_DAYS) {
    return { show: false, reason: "far", startsIn, checkBack: addDays(start!, -7) };
  }
  // Inside the window, but the forecast may still stop short of the trip.
  return { show: true, covers: startsIn <= 6 };
}

export function addDays(iso: string, days: number): string | null {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

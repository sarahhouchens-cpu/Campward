/**
 * Weather & conditions lookup.
 *
 * NO API KEY IS REQUIRED for any of this. Both services below are open:
 *   - api.weather.gov  (US National Weather Service) — forecast + active alerts.
 *     Asks only for a descriptive User-Agent with contact info.
 *   - api.open-meteo.com — worldwide fallback for trips outside NWS coverage.
 *
 * Set CAMPWARD_CONTACT in .env.local to your email so the NWS can reach you if
 * a request misbehaves. It is courtesy, not authentication.
 */

const CONTACT = process.env.CAMPWARD_CONTACT ?? "campward@example.com";
const UA = `Campward/0.1 (personal trip logbook; ${CONTACT})`;

export type ForecastPeriod = {
  name: string;
  isDaytime: boolean;
  temperature: number | null;
  temperatureUnit: string;
  wind: string;
  shortForecast: string;
  detailedForecast: string;
  precipChance: number | null;
};

export type WeatherAlert = {
  event: string;
  severity: string;
  headline: string;
};

export type ForecastResult = {
  source: "National Weather Service" | "Open-Meteo";
  place: string | null;
  periods: ForecastPeriod[];
  alerts: WeatherAlert[];
  fetchedAt: string;
};

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/geo+json, application/json" },
    // Conditions move slowly enough that a 30-minute cache is plenty, and it
    // keeps us well clear of any rate limit.
    next: { revalidate: 1800 },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

/* ------------------------------------------------- National Weather Service */

type NwsPoints = {
  properties?: {
    forecast?: string;
    relativeLocation?: { properties?: { city?: string; state?: string } };
  };
};

type NwsForecast = {
  properties?: {
    periods?: Array<{
      name?: string;
      isDaytime?: boolean;
      temperature?: number;
      temperatureUnit?: string;
      windSpeed?: string;
      windDirection?: string;
      shortForecast?: string;
      detailedForecast?: string;
      probabilityOfPrecipitation?: { value?: number | null };
    }>;
  };
};

type NwsAlerts = {
  features?: Array<{
    properties?: { event?: string; severity?: string; headline?: string };
  }>;
};

async function fromNws(lat: number, lon: number): Promise<ForecastResult> {
  const coords = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const points = (await getJson(`https://api.weather.gov/points/${coords}`)) as NwsPoints;

  const forecastUrl = points.properties?.forecast;
  if (!forecastUrl) throw new Error("No NWS forecast grid for this location");

  const [forecast, alerts] = await Promise.all([
    getJson(forecastUrl) as Promise<NwsForecast>,
    getJson(`https://api.weather.gov/alerts/active?point=${coords}`).catch(
      () => ({}) as NwsAlerts,
    ) as Promise<NwsAlerts>,
  ]);

  const local = points.properties?.relativeLocation?.properties;

  return {
    source: "National Weather Service",
    place: local?.city ? `${local.city}, ${local.state ?? ""}`.trim() : null,
    periods: (forecast.properties?.periods ?? []).slice(0, 10).map((p) => ({
      name: p.name ?? "",
      isDaytime: p.isDaytime ?? true,
      temperature: p.temperature ?? null,
      temperatureUnit: p.temperatureUnit ?? "F",
      wind: [p.windSpeed, p.windDirection].filter(Boolean).join(" "),
      shortForecast: p.shortForecast ?? "",
      detailedForecast: p.detailedForecast ?? "",
      precipChance: p.probabilityOfPrecipitation?.value ?? null,
    })),
    alerts: (alerts.features ?? []).map((f) => ({
      event: f.properties?.event ?? "Alert",
      severity: f.properties?.severity ?? "Unknown",
      headline: f.properties?.headline ?? "",
    })),
    fetchedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------- Open-Meteo */

type OpenMeteoDaily = {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
    weather_code?: number[];
  };
};

// Abbreviated WMO code table — enough to describe a day in plain language.
const WMO: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle",
  55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Rain showers", 81: "Rain showers", 82: "Violent rain showers",
  85: "Snow showers", 86: "Heavy snow showers", 95: "Thunderstorms",
  96: "Thunderstorms with hail", 99: "Thunderstorms with hail",
};

async function fromOpenMeteo(lat: number, lon: number): Promise<ForecastResult> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,` +
    `precipitation_probability_max,wind_speed_10m_max` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;

  const data = (await getJson(url)) as OpenMeteoDaily;
  const daily = data.daily ?? {};
  const days = daily.time ?? [];

  return {
    source: "Open-Meteo",
    place: null,
    periods: days.map((day, i) => {
      const high = daily.temperature_2m_max?.[i] ?? null;
      const low = daily.temperature_2m_min?.[i] ?? null;
      const sky = WMO[daily.weather_code?.[i] ?? -1] ?? "Mixed conditions";
      return {
        name: new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
          weekday: "long",
        }),
        isDaytime: true,
        temperature: high == null ? null : Math.round(high),
        temperatureUnit: "F",
        wind: daily.wind_speed_10m_max?.[i]
          ? `up to ${Math.round(daily.wind_speed_10m_max[i])} mph`
          : "",
        shortForecast: sky,
        detailedForecast:
          low == null ? sky : `${sky}. Overnight low around ${Math.round(low)}°F.`,
        precipChance: daily.precipitation_probability_max?.[i] ?? null,
      };
    }),
    alerts: [],
    fetchedAt: new Date().toISOString(),
  };
}

/** NWS where it has coverage, Open-Meteo everywhere else. */
export async function getForecast(lat: number, lon: number): Promise<ForecastResult> {
  try {
    return await fromNws(lat, lon);
  } catch {
    return await fromOpenMeteo(lat, lon);
  }
}

/* --------------------------------------------------------- packing hints -- */

/** Turns a forecast into the handful of "don't forget…" lines worth acting on. */
export function packingHints(forecast: ForecastResult): string[] {
  const hints: string[] = [];
  const periods = forecast.periods;
  if (periods.length === 0) return hints;

  const temps = periods.map((p) => p.temperature).filter((t): t is number => t != null);
  const coldest = temps.length ? Math.min(...temps) : null;
  const hottest = temps.length ? Math.max(...temps) : null;
  const wettest = Math.max(0, ...periods.map((p) => p.precipChance ?? 0));
  const text = periods.map((p) => `${p.shortForecast} ${p.detailedForecast}`).join(" ").toLowerCase();

  if (coldest != null && coldest <= 32) {
    hints.push("Freezing temperatures in the forecast — cold-rated bag, insulated pad, and water stored so it can't freeze.");
  } else if (coldest != null && coldest <= 45) {
    hints.push("Cold nights ahead — pack the warm layer and a hat you can sleep in.");
  }

  if (hottest != null && hottest >= 85) {
    hints.push("Hot days — extra water capacity, electrolytes, and shade you can rig.");
  }

  if (wettest >= 50) {
    hints.push(`Rain likely (${wettest}% chance) — rain shells, a tarp over the kitchen, and dry bags for the sleep system.`);
  } else if (wettest >= 25) {
    hints.push(`Some chance of rain (${wettest}%) — bring the shells even if it looks clear at the trailhead.`);
  }

  if (text.includes("thunder")) {
    hints.push("Thunderstorms possible — plan to be off exposed ridges by early afternoon.");
  }
  if (text.includes("snow")) hints.push("Snow in the forecast — traction devices and waterproof boots.");
  if (text.includes("wind") && text.match(/\b([2-9]\d|1\d\d) mph/)) {
    hints.push("Windy — extra stakes and guylines, and pick a sheltered site.");
  }
  if (forecast.alerts.length > 0) {
    hints.push(`${forecast.alerts.length} active weather alert(s) for this area — read them before you commit.`);
  }

  if (hints.length === 0) hints.push("Nothing alarming in the forecast. Standard kit should do it.");
  return hints;
}

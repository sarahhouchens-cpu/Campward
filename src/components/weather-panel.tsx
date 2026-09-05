import { CloudIcon } from "@/components/icons";
import { getForecast, packingHints } from "@/lib/weather";

/**
 * Conditions for a trip's coordinates. Rendered as its own async component so
 * the rest of the trip page paints immediately and the network call streams in
 * behind a Suspense boundary.
 */
export async function WeatherPanel({
  latitude,
  longitude,
  covers = true,
}: {
  latitude: number;
  longitude: number;
  /** False when the forecast stops short of the trip's dates. */
  covers?: boolean;
}) {
  let forecast;
  try {
    forecast = await getForecast(latitude, longitude);
  } catch {
    return (
      <div className="card card-quiet">
        <p className="muted" style={{ margin: 0 }}>
          Couldn&rsquo;t reach the weather services just now. Try again in a minute —
          nothing is stored, so a reload is all it takes.
        </p>
      </div>
    );
  }

  const hints = packingHints(forecast);

  return (
    <div className="stack">
      {forecast.alerts.length > 0 && (
        <div className="stack-sm">
          {forecast.alerts.map((alert, i) => (
            <div key={i} className="alert">
              <p className="eyebrow" style={{ marginBottom: ".2rem" }}>
                {alert.severity} · {alert.event}
              </p>
              <p style={{ margin: 0, fontSize: ".93rem" }}>{alert.headline}</p>
            </div>
          ))}
        </div>
      )}

      {forecast.periods.length === 0 ? (
        <p className="muted">No forecast available for this spot.</p>
      ) : (
        <div className="forecast">
          {forecast.periods.map((period, i) => (
            <div key={i} className="forecast-day">
              <div className="when">{period.name}</div>
              <div className="temp">
                {period.temperature == null ? "—" : `${period.temperature}°`}
              </div>
              <div className="sky">{period.shortForecast}</div>
              {period.precipChance != null && period.precipChance > 0 && (
                <div className="faint" style={{ fontSize: ".78rem", marginTop: ".2rem" }}>
                  {period.precipChance}% precip
                </div>
              )}
              {period.wind && (
                <div className="faint" style={{ fontSize: ".78rem" }}>
                  Wind {period.wind}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!covers && (
        <p className="faint" style={{ margin: 0, fontSize: ".82rem" }}>
          Heads up: this is the week ahead at that spot — it doesn&rsquo;t reach your
          dates yet.
        </p>
      )}

      <div className="card card-quiet">
        <p className="eyebrow" style={{ marginBottom: ".5rem" }}>
          What this means for the packing list
        </p>
        <ul className="checklist">
          {hints.map((hint, i) => (
            <li key={i}>
              <span style={{ color: "var(--dusk)" }}>·</span>
              <span>{hint}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="faint" style={{ margin: 0, fontSize: ".8rem" }}>
        Source: {forecast.source}
        {forecast.place ? ` · nearest station ${forecast.place}` : ""} · fetched{" "}
        {new Date(forecast.fetchedAt).toLocaleString()}
      </p>
    </div>
  );
}

export function WeatherPanelSkeleton() {
  return (
    <div className="card card-quiet row-tight">
      <CloudIcon size={20} />
      <span className="muted">Reading the sky…</span>
    </div>
  );
}

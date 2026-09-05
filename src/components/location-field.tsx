"use client";

import { useState } from "react";

type Suggestion = { label: string; latitude: number; longitude: number };

/**
 * Address in, coordinates out. Typing an address is enough on its own — the
 * lookup is there when you want the map and the weather to work, and the
 * coordinate boxes stay editable for anywhere Nominatim has never heard of.
 */
export function LocationField({
  location = "",
  latitude = null,
  longitude = null,
}: {
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const [query, setQuery] = useState(location);
  const [lat, setLat] = useState(latitude?.toString() ?? "");
  const [lon, setLon] = useState(longitude?.toString() ?? "");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<"idle" | "looking" | "none" | "error">("idle");

  async function lookup() {
    if (!query.trim()) return;
    setStatus("looking");
    setResults([]);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResults(data.results ?? []);
      setStatus(data.results?.length ? "idle" : "none");
    } catch {
      setStatus("error");
    }
  }

  function choose(pick: Suggestion) {
    setQuery(pick.label);
    setLat(pick.latitude.toFixed(6));
    setLon(pick.longitude.toFixed(6));
    setResults([]);
    setStatus("idle");
  }

  return (
    <>
      <div className="field">
        <label htmlFor="location">Where</label>
        <div className="row" style={{ gap: ".5rem", flexWrap: "nowrap" }}>
          <input
            id="location"
            name="location"
            type="text"
            className="grow"
            value={query}
            placeholder="Cataloochee Campground, Great Smoky Mountains"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              // Enter inside the address box should search, not submit the form.
              if (event.key === "Enter") {
                event.preventDefault();
                void lookup();
              }
            }}
          />
          <button type="button" className="btn btn-small" onClick={lookup}>
            {status === "looking" ? "Looking…" : "Find"}
          </button>
        </div>

        {results.length > 0 && (
          <ul className="entries" style={{ marginTop: ".5rem" }}>
            {results.map((pick) => (
              <li key={`${pick.latitude},${pick.longitude}`} style={{ padding: ".4rem 0" }}>
                <button
                  type="button"
                  className="btn-plain"
                  style={{ textAlign: "left", textTransform: "none", letterSpacing: 0, fontSize: ".88rem", fontWeight: 400 }}
                  onClick={() => choose(pick)}
                >
                  {pick.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {status === "none" && (
          <p className="faint" style={{ marginTop: ".4rem", fontSize: ".85rem" }}>
            Nothing found. Try a nearby town, or drop the coordinates in below.
          </p>
        )}
        {status === "error" && (
          <p className="faint" style={{ marginTop: ".4rem", fontSize: ".85rem" }}>
            Lookup service is not answering. Coordinates can go in by hand.
          </p>
        )}
      </div>

      <div className="field-row">
        <div>
          <label htmlFor="latitude">Latitude</label>
          <input
            id="latitude"
            name="latitude"
            type="text"
            inputMode="decimal"
            value={lat}
            placeholder="35.6532"
            onChange={(event) => setLat(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="longitude">Longitude</label>
          <input
            id="longitude"
            name="longitude"
            type="text"
            inputMode="decimal"
            value={lon}
            placeholder="-83.1067"
            onChange={(event) => setLon(event.target.value)}
          />
        </div>
      </div>
    </>
  );
}

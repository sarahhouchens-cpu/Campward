import { NextResponse } from "next/server";
import { getForecast, packingHints } from "@/lib/weather";

/** Forecast for a coordinate pair. No API key required — see src/lib/weather.ts. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Need ?lat= and ?lon=" }, { status: 400 });
  }

  try {
    const forecast = await getForecast(lat, lon);
    return NextResponse.json({ ...forecast, hints: packingHints(forecast) });
  } catch {
    return NextResponse.json(
      { error: "Weather services are not answering right now." },
      { status: 502 },
    );
  }
}

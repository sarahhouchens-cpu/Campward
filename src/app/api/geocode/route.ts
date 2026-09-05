import { NextResponse } from "next/server";

/**
 * Address -> coordinates, via OpenStreetMap's Nominatim.
 *
 * NO API KEY REQUIRED. Nominatim asks for a real User-Agent and no more than
 * one request per second — fine for two people typing in trip locations.
 * Set CAMPWARD_CONTACT so they can reach you if something goes wrong.
 */
const CONTACT = process.env.CAMPWARD_CONTACT ?? "campward@example.com";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing ?q=" }, { status: 400 });
  }

  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=" +
    encodeURIComponent(query);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": `Campward/0.1 (personal trip logbook; ${CONTACT})`,
        "Accept-Language": "en",
      },
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error(`${response.status}`);

    const raw = (await response.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
    }>;

    return NextResponse.json({
      results: raw.map((r) => ({
        label: r.display_name ?? "",
        latitude: Number(r.lat),
        longitude: Number(r.lon),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the geocoding service. Enter coordinates by hand." },
      { status: 502 },
    );
  }
}

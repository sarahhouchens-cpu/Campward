import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CampsiteForm } from "@/components/campsite-form";
import { HikeForm } from "@/components/hike-form";
import { CloudIcon, CompassIcon, PeakIcon, PotIcon, Rating, TentIcon } from "@/components/icons";
import { MapFrame } from "@/components/map-frame";
import { MealPlanner } from "@/components/meal-planner";
import { PackList } from "@/components/pack-list";
import { WeatherPanel, WeatherPanelSkeleton } from "@/components/weather-panel";
import { deleteCampsite, deleteHike } from "@/lib/actions";
import { coordLabel, daysUntil, formatDate, formatRange, nightsBetween } from "@/lib/format";
import { campsitesForTrip, getTrip, hikesForTrip } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = getTrip(Number(id));
  return { title: trip ? `${trip.title} — Campward` : "Trip — Campward" };
}

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tripId = Number(id);
  const trip = getTrip(tripId);
  if (!trip) notFound();

  const campsites = campsitesForTrip(tripId);
  const hikes = hikesForTrip(tripId);
  const nights = nightsBetween(trip.start_date, trip.end_date);
  const countdown = trip.status === "planned" ? daysUntil(trip.start_date) : null;
  const hasCoords = trip.latitude != null && trip.longitude != null;
  const miles = hikes.reduce((sum, h) => sum + (h.distance_miles ?? 0), 0);

  return (
    <>
      <Link href="/trips" className="crumb">
        ← Trips
      </Link>

      <header className="spread" style={{ marginBottom: "1.4rem" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: ".3rem" }}>
            {formatRange(trip.start_date, trip.end_date)}
            {nights != null && nights > 0 && ` · ${nights} ${nights === 1 ? "night" : "nights"}`}
          </p>
          <h1 style={{ margin: 0 }}>{trip.title}</h1>
          <p className="muted" style={{ margin: ".35rem 0 0" }}>
            {trip.location || coordLabel(trip.latitude, trip.longitude) || "Location not set"}
          </p>
        </div>
        <div className="row-tight">
          {trip.status === "completed" ? (
            <span className="stamp stamp-moss">Logged</span>
          ) : countdown != null && countdown >= 0 ? (
            <span className="stamp">
              {countdown === 0 ? "Today" : `${countdown} days out`}
            </span>
          ) : (
            <span className="stamp">Planned</span>
          )}
          <Link href={`/trips/${trip.id}/edit`} className="btn btn-small">
            Edit
          </Link>
        </div>
      </header>

      <div className="split">
        {/* -------------------------------------------------- left column -- */}
        <div>
          {trip.notes && (
            <section className="card stitched" style={{ marginBottom: "1.6rem" }}>
              <p className="eyebrow">Trip notes</p>
              <div className="ruled">{trip.notes}</div>
            </section>
          )}

          <section className="section" style={{ marginTop: trip.notes ? "2.2rem" : 0 }}>
            <header className="row-tight" style={{ marginBottom: ".8rem" }}>
              <TentIcon size={20} />
              <h2 style={{ margin: 0 }}>Campsites</h2>
              <span className="faint" style={{ fontSize: ".85rem" }}>
                {campsites.length}
              </span>
            </header>

            {campsites.length === 0 ? (
              <div className="empty">
                <p>No sites recorded for this trip yet.</p>
              </div>
            ) : (
              <div className="stack-sm">
                {campsites.map((site) => (
                  <article key={site.id} className="card">
                    <div className="spread">
                      <div>
                        <h3 style={{ marginBottom: ".1rem" }}>{site.name}</h3>
                        <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>
                          {[site.site_number && `Site ${site.site_number}`, formatDate(site.visited_on)]
                            .filter(Boolean)
                            .join(" · ") || site.location}
                        </p>
                      </div>
                      <Rating value={site.rating} />
                    </div>
                    {site.notes && (
                      <p className="field-note" style={{ marginTop: ".7rem", marginBottom: 0 }}>
                        {site.notes}
                      </p>
                    )}
                    {site.would_return === 1 && (
                      <p className="hand" style={{ margin: ".55rem 0 0" }}>
                        Stay here again.
                      </p>
                    )}
                    <details className="drawer" style={{ marginTop: ".5rem" }}>
                      <summary>Edit</summary>
                      <CampsiteForm campsite={site} tripId={tripId} />
                      <form action={deleteCampsite} style={{ marginTop: ".5rem" }}>
                        <input type="hidden" name="id" value={site.id} />
                        <input type="hidden" name="trip_id" value={tripId} />
                        <button type="submit" className="btn-plain">
                          Delete this site
                        </button>
                      </form>
                    </details>
                  </article>
                ))}
              </div>
            )}

            <details className="drawer" style={{ marginTop: ".8rem" }}>
              <summary>Log a campsite</summary>
              <CampsiteForm tripId={tripId} />
            </details>
          </section>

          <section className="section">
            <header className="row-tight" style={{ marginBottom: ".8rem" }}>
              <PeakIcon size={20} />
              <h2 style={{ margin: 0 }}>Hikes</h2>
              <span className="faint" style={{ fontSize: ".85rem" }}>
                {hikes.length > 0 ? `${hikes.length} · ${miles.toFixed(1)} mi` : "0"}
              </span>
            </header>

            {hikes.length === 0 ? (
              <div className="empty">
                <p>No hikes logged for this trip yet.</p>
              </div>
            ) : (
              <div className="stack-sm">
                {hikes.map((hike) => (
                  <article key={hike.id} className="card">
                    <div className="spread">
                      <div>
                        <h3 style={{ marginBottom: ".1rem" }}>{hike.name}</h3>
                        <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>
                          {[
                            hike.distance_miles ? `${hike.distance_miles} mi` : null,
                            hike.elevation_ft ? `${hike.elevation_ft.toLocaleString()} ft` : null,
                            formatDate(hike.hiked_on) || null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="row-tight" style={{ justifyContent: "flex-end" }}>
                          <span className="label" style={{ margin: 0 }}>
                            Hard
                          </span>
                          <Rating value={hike.difficulty} />
                        </div>
                        <div className="row-tight" style={{ justifyContent: "flex-end" }}>
                          <span className="label" style={{ margin: 0 }}>
                            Views
                          </span>
                          <Rating value={hike.views} />
                        </div>
                      </div>
                    </div>
                    {hike.notes && (
                      <p className="field-note" style={{ marginTop: ".7rem", marginBottom: 0 }}>
                        {hike.notes}
                      </p>
                    )}
                    {hike.would_repeat === 1 && (
                      <p className="hand" style={{ margin: ".55rem 0 0" }}>
                        Worth repeating.
                      </p>
                    )}
                    <details className="drawer" style={{ marginTop: ".5rem" }}>
                      <summary>Edit</summary>
                      <HikeForm hike={hike} tripId={tripId} />
                      <form action={deleteHike} style={{ marginTop: ".5rem" }}>
                        <input type="hidden" name="id" value={hike.id} />
                        <input type="hidden" name="trip_id" value={tripId} />
                        <button type="submit" className="btn-plain">
                          Delete this hike
                        </button>
                      </form>
                    </details>
                  </article>
                ))}
              </div>
            )}

            <details className="drawer" style={{ marginTop: ".8rem" }}>
              <summary>Log a hike</summary>
              <HikeForm tripId={tripId} />
            </details>
          </section>

          <section className="section">
            <header className="row-tight" style={{ marginBottom: ".8rem" }}>
              <PotIcon size={20} />
              <h2 style={{ margin: 0 }}>Meals</h2>
            </header>
            <MealPlanner tripId={tripId} startDate={trip.start_date} />
          </section>
        </div>

        {/* ------------------------------------------------- right column -- */}
        <aside className="stack">
          {hasCoords ? (
            <div>
              <MapFrame
                latitude={trip.latitude!}
                longitude={trip.longitude!}
                label={trip.location || trip.title}
              />
              <p className="faint" style={{ margin: ".4rem 0 0", fontSize: ".8rem" }}>
                {coordLabel(trip.latitude, trip.longitude)} ·{" "}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${trip.latitude}&mlon=${trip.longitude}#map=13/${trip.latitude}/${trip.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Larger map
                </a>
              </p>
            </div>
          ) : (
            <div className="empty">
              <p>
                Add coordinates on the{" "}
                <Link href={`/trips/${trip.id}/edit`}>edit page</Link> to get a map and
                the weather forecast.
              </p>
            </div>
          )}

          <section>
            <header className="row-tight" style={{ marginBottom: ".7rem" }}>
              <CloudIcon size={20} />
              <h2 style={{ margin: 0 }}>Conditions</h2>
            </header>
            {hasCoords ? (
              <Suspense fallback={<WeatherPanelSkeleton />}>
                <WeatherPanel latitude={trip.latitude!} longitude={trip.longitude!} />
              </Suspense>
            ) : (
              <p className="muted" style={{ fontSize: ".92rem" }}>
                No coordinates, no forecast.
              </p>
            )}
          </section>

          <section>
            <header className="row-tight" style={{ marginBottom: ".7rem" }}>
              <CompassIcon size={20} />
              <h2 style={{ margin: 0 }}>Bring this trip</h2>
            </header>
            <PackList tripId={tripId} />
          </section>
        </aside>
      </div>
    </>
  );
}

import Link from "next/link";
import { Rating, TentIcon } from "@/components/icons";
import { daysUntil, formatRange, nightsBetween } from "@/lib/format";
import { listCampsites, listHikes, listTrips, logbookSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function LogbookPage() {
  const trips = listTrips();
  const summary = logbookSummary();
  const campsites = listCampsites().slice(0, 4);
  const hikes = listHikes().slice(0, 4);

  const upcoming = trips.filter((t) => t.status === "planned").slice(0, 3);
  const recent = trips.filter((t) => t.status === "completed").slice(0, 4);
  const next = upcoming[0];
  const countdown = next ? daysUntil(next.start_date) : null;

  return (
    <>
      <section className="split" style={{ marginTop: "1.5rem" }}>
        <div>
          <p className="eyebrow">The logbook</p>
          <h1>Everywhere we&rsquo;ve slept outside.</h1>
          <p className="lede">
            Trips, the sites we stayed at, the hikes we took, and the gear that came
            along. Write it down while it&rsquo;s fresh — you will not remember which
            site had the good creek access next October.
          </p>
          <div className="row">
            <Link href="/trips/new" className="btn btn-primary">
              <TentIcon size={17} /> Start a trip
            </Link>
            <Link href="/gear" className="btn">
              Gear closet
            </Link>
          </div>
        </div>

        <div className="stack">
          {next ? (
            <article className="card card-lit stitched">
              <p className="eyebrow" style={{ marginBottom: ".25rem" }}>
                Next out
              </p>
              <h3 style={{ marginBottom: ".2rem" }}>
                <Link href={`/trips/${next.id}`} style={{ color: "inherit" }}>
                  {next.title}
                </Link>
              </h3>
              <p className="muted" style={{ marginBottom: ".5rem" }}>
                {next.location || "Location not set yet"}
              </p>
              <p className="hand" style={{ margin: 0 }}>
                {countdown == null
                  ? "No dates on the calendar yet"
                  : countdown > 1
                    ? `${countdown} days out`
                    : countdown === 1
                      ? "Tomorrow!"
                      : countdown === 0
                        ? "Today — go."
                        : "Underway"}
              </p>
              <p className="muted" style={{ margin: ".35rem 0 0", fontSize: ".9rem" }}>
                {formatRange(next.start_date, next.end_date)}
              </p>
            </article>
          ) : (
            <div className="empty">
              <p>No trip on the books.</p>
              <Link href="/trips/new" className="btn btn-small">
                Plan one
              </Link>
            </div>
          )}

          <div className="tally">
            <div>
              <b>{summary.trips}</b>
              <small>Trips</small>
            </div>
            <div>
              <b>{Math.round(summary.nights)}</b>
              <small>Nights out</small>
            </div>
            <div>
              <b>{Math.round(summary.miles)}</b>
              <small>Trail miles</small>
            </div>
          </div>
        </div>
      </section>

      {upcoming.length > 1 && (
        <section className="section">
          <header className="spread">
            <h2>On the calendar</h2>
            <Link href="/trips" className="crumb">
              All trips →
            </Link>
          </header>
          <div className="cards">
            {upcoming.slice(1).map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="card card-link">
                <p className="eyebrow" style={{ marginBottom: ".3rem" }}>
                  {formatRange(trip.start_date, trip.end_date)}
                </p>
                <h3 style={{ marginBottom: ".2rem" }}>{trip.title}</h3>
                <p className="muted" style={{ margin: 0, fontSize: ".92rem" }}>
                  {trip.location || "Location not set"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section split">
        <div>
          <header className="spread">
            <h2>Recent trips</h2>
            <Link href="/trips" className="crumb">
              All →
            </Link>
          </header>
          {recent.length === 0 ? (
            <div className="empty">
              <p>Nothing logged yet. Once a trip is done, mark it complete and it lands here.</p>
            </div>
          ) : (
            <ul className="entries">
              {recent.map((trip) => {
                const nights = nightsBetween(trip.start_date, trip.end_date);
                return (
                  <li key={trip.id}>
                    <div className="spread">
                      <div>
                        <Link href={`/trips/${trip.id}`}>
                          <strong>{trip.title}</strong>
                        </Link>
                        <div className="muted" style={{ fontSize: ".9rem" }}>
                          {trip.location || "—"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="faint" style={{ fontSize: ".85rem" }}>
                          {formatRange(trip.start_date, trip.end_date)}
                        </div>
                        {nights != null && (
                          <div className="faint" style={{ fontSize: ".8rem" }}>
                            {nights} {nights === 1 ? "night" : "nights"}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="stack">
          <div className="card card-quiet">
            <header className="spread">
              <h3 style={{ margin: 0 }}>Latest sites</h3>
              <Link href="/campsites" className="crumb" style={{ margin: 0 }}>
                All →
              </Link>
            </header>
            {campsites.length === 0 ? (
              <p className="muted" style={{ margin: ".6rem 0 0", fontSize: ".9rem" }}>
                No campsites rated yet.
              </p>
            ) : (
              <ul className="entries" style={{ marginTop: ".6rem" }}>
                {campsites.map((site) => (
                  <li key={site.id} style={{ padding: ".55rem 0" }}>
                    <div className="spread" style={{ gap: ".5rem" }}>
                      <span>{site.name}</span>
                      <Rating value={site.rating} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card card-quiet">
            <header className="spread">
              <h3 style={{ margin: 0 }}>Latest hikes</h3>
              <Link href="/hikes" className="crumb" style={{ margin: 0 }}>
                All →
              </Link>
            </header>
            {hikes.length === 0 ? (
              <p className="muted" style={{ margin: ".6rem 0 0", fontSize: ".9rem" }}>
                No hikes logged yet.
              </p>
            ) : (
              <ul className="entries" style={{ marginTop: ".6rem" }}>
                {hikes.map((hike) => (
                  <li key={hike.id} style={{ padding: ".55rem 0" }}>
                    <div className="spread" style={{ gap: ".5rem" }}>
                      <span>{hike.name}</span>
                      <span className="faint" style={{ fontSize: ".85rem" }}>
                        {hike.distance_miles ? `${hike.distance_miles} mi` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

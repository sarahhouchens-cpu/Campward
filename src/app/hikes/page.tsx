import Link from "next/link";
import { HikeForm } from "@/components/hike-form";
import { Rating } from "@/components/icons";
import { deleteHike } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { listHikes, listTrips } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hikes — Campward" };

export default function HikesPage() {
  const hikes = listHikes();
  const trips = listTrips();
  const miles = hikes.reduce((sum, h) => sum + (h.distance_miles ?? 0), 0);
  const gain = hikes.reduce((sum, h) => sum + (h.elevation_ft ?? 0), 0);

  return (
    <>
      <header style={{ marginTop: "1.5rem", marginBottom: "1.4rem" }}>
        <p className="eyebrow">Hikes</p>
        <h1 style={{ margin: 0 }}>Trails, walked</h1>
        <p className="lede" style={{ marginTop: ".5rem" }}>
          {hikes.length === 0
            ? "Distance, climb, and whether it was worth it."
            : `${hikes.length} logged — ${miles.toFixed(1)} miles and ${gain.toLocaleString()} feet of climbing.`}
        </p>
      </header>

      <details className="drawer card card-quiet" style={{ marginBottom: "1.6rem" }}>
        <summary>Log a hike</summary>
        <HikeForm trips={trips} />
      </details>

      {hikes.length === 0 ? (
        <div className="empty">
          <p>No hikes yet. Add one above, or log one from inside a trip.</p>
        </div>
      ) : (
        <div className="stack">
          {hikes.map((hike) => (
            <article key={hike.id} className="card">
              <div className="spread">
                <div>
                  <h3 style={{ marginBottom: ".15rem" }}>{hike.name}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: ".93rem" }}>
                    {[
                      hike.distance_miles ? `${hike.distance_miles} mi` : null,
                      hike.elevation_ft ? `${hike.elevation_ft.toLocaleString()} ft gain` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No distance recorded"}
                  </p>
                </div>
                <div className="faint" style={{ fontSize: ".82rem" }}>
                  {formatDate(hike.hiked_on)}
                </div>
              </div>

              <div className="row" style={{ marginTop: ".7rem", gap: "1.1rem" }}>
                <span className="row-tight">
                  <span className="label" style={{ margin: 0 }}>
                    Difficulty
                  </span>
                  <Rating value={hike.difficulty} />
                </span>
                <span className="row-tight">
                  <span className="label" style={{ margin: 0 }}>
                    Views
                  </span>
                  <Rating value={hike.views} />
                </span>
              </div>

              <div className="row-tight" style={{ marginTop: ".6rem" }}>
                {hike.would_repeat ? (
                  <span className="tag tag-moss">Would do again</span>
                ) : (
                  <span className="tag tag-dust">Been there</span>
                )}
                {hike.trip_id && hike.trip_title && (
                  <Link href={`/trips/${hike.trip_id}`} className="tag tag-dusk">
                    {hike.trip_title}
                  </Link>
                )}
              </div>

              {hike.notes && (
                <p className="field-note" style={{ marginTop: ".8rem", marginBottom: 0 }}>
                  {hike.notes}
                </p>
              )}

              <details className="drawer" style={{ marginTop: ".7rem" }}>
                <summary>Edit</summary>
                <HikeForm hike={hike} trips={trips} />
                <form action={deleteHike} style={{ marginTop: ".6rem" }}>
                  <input type="hidden" name="id" value={hike.id} />
                  <input type="hidden" name="trip_id" value={hike.trip_id ?? ""} />
                  <button type="submit" className="btn-plain">
                    Delete this hike
                  </button>
                </form>
              </details>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

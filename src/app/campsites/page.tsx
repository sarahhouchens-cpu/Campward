import Link from "next/link";
import { CampsiteForm } from "@/components/campsite-form";
import { Rating } from "@/components/icons";
import { deleteCampsite } from "@/lib/actions";
import { coordLabel, formatDate } from "@/lib/format";
import { listCampsites, listTrips } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campsites — Campward" };

export default function CampsitesPage() {
  const sites = listCampsites();
  const trips = listTrips();
  const rated = sites.filter((s) => s.rating != null);
  const average =
    rated.length > 0
      ? (rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length).toFixed(1)
      : null;

  return (
    <>
      <header style={{ marginTop: "1.5rem", marginBottom: "1.4rem" }}>
        <p className="eyebrow">Campsites</p>
        <h1 style={{ margin: 0 }}>Sites we&rsquo;ve slept at</h1>
        <p className="lede" style={{ marginTop: ".5rem" }}>
          {sites.length === 0
            ? "Rate them while the memory is sharp — the good ones book out early next year."
            : `${sites.length} logged${average ? `, averaging ${average} out of 5` : ""}.`}
        </p>
      </header>

      <details className="drawer card card-quiet" style={{ marginBottom: "1.6rem" }}>
        <summary>Log a campsite</summary>
        <CampsiteForm trips={trips} />
      </details>

      {sites.length === 0 ? (
        <div className="empty">
          <p>No campsites yet. Add one above, or log one from inside a trip.</p>
        </div>
      ) : (
        <div className="stack">
          {sites.map((site) => (
            <article key={site.id} className="card">
              <div className="spread">
                <div>
                  <h3 style={{ marginBottom: ".15rem" }}>{site.name}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: ".93rem" }}>
                    {site.location || coordLabel(site.latitude, site.longitude) || "Location not recorded"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Rating value={site.rating} />
                  <div className="faint" style={{ fontSize: ".82rem" }}>
                    {formatDate(site.visited_on)}
                  </div>
                </div>
              </div>

              <div className="row-tight" style={{ marginTop: ".65rem" }}>
                {site.site_number && <span className="tag">Site {site.site_number}</span>}
                {site.would_return ? (
                  <span className="tag tag-moss">Would return</span>
                ) : (
                  <span className="tag tag-dust">Once was enough</span>
                )}
                {site.trip_id && site.trip_title && (
                  <Link href={`/trips/${site.trip_id}`} className="tag tag-dusk">
                    {site.trip_title}
                  </Link>
                )}
              </div>

              {site.notes && (
                <p className="field-note" style={{ marginTop: ".8rem", marginBottom: 0 }}>
                  {site.notes}
                </p>
              )}

              <details className="drawer" style={{ marginTop: ".7rem" }}>
                <summary>Edit</summary>
                <CampsiteForm campsite={site} trips={trips} />
                <form action={deleteCampsite} style={{ marginTop: ".6rem" }}>
                  <input type="hidden" name="id" value={site.id} />
                  <input type="hidden" name="trip_id" value={site.trip_id ?? ""} />
                  <button type="submit" className="btn-plain">
                    Delete this site
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

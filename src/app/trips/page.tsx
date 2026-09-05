import Link from "next/link";
import { TentIcon } from "@/components/icons";
import { formatRange, nightsBetween } from "@/lib/format";
import { listTrips } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trips — Campward" };

export default function TripsPage() {
  const trips = listTrips();
  const planned = trips.filter((t) => t.status === "planned");
  const past = trips.filter((t) => t.status === "completed");

  return (
    <>
      <header className="spread" style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
        <div>
          <p className="eyebrow">Trips</p>
          <h1 style={{ margin: 0 }}>Where we&rsquo;re going, where we&rsquo;ve been</h1>
        </div>
        <Link href="/trips/new" className="btn btn-primary">
          <TentIcon size={17} /> New trip
        </Link>
      </header>

      {trips.length === 0 && (
        <div className="empty">
          <p>The logbook is empty. The first entry is the hardest.</p>
          <Link href="/trips/new" className="btn btn-small">
            Start a trip
          </Link>
        </div>
      )}

      {planned.length > 0 && (
        <section className="section" style={{ marginTop: 0 }}>
          <h2>Coming up</h2>
          <div className="cards">
            {planned.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="section">
          <h2>Logged</h2>
          <div className="cards">
            {past.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function TripCard({ trip }: { trip: ReturnType<typeof listTrips>[number] }) {
  const nights = nightsBetween(trip.start_date, trip.end_date);

  return (
    <Link href={`/trips/${trip.id}`} className="card card-link stitched">
      <p className="eyebrow" style={{ marginBottom: ".35rem" }}>
        {formatRange(trip.start_date, trip.end_date)}
      </p>
      <h3 style={{ marginBottom: ".25rem" }}>{trip.title}</h3>
      <p className="muted" style={{ margin: "0 0 .7rem", fontSize: ".93rem" }}>
        {trip.location || "Location not set"}
      </p>
      <div className="row-tight">
        {trip.status === "completed" ? (
          <span className="tag tag-moss">Logged</span>
        ) : (
          <span className="tag tag-dusk">Planned</span>
        )}
        {nights != null && nights > 0 && (
          <span className="tag">
            {nights} {nights === 1 ? "night" : "nights"}
          </span>
        )}
      </div>
    </Link>
  );
}

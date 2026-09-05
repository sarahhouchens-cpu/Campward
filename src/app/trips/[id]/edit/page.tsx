import Link from "next/link";
import { notFound } from "next/navigation";
import { TripForm } from "@/components/trip-form";
import { deleteTrip } from "@/lib/actions";
import { getTrip } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = getTrip(Number(id));
  if (!trip) notFound();

  return (
    <>
      <Link href={`/trips/${trip.id}`} className="crumb">
        ← {trip.title}
      </Link>
      <h1>Edit trip</h1>
      <div style={{ maxWidth: "44rem" }}>
        <TripForm trip={trip} />

        <details className="drawer" style={{ marginTop: "1.5rem" }}>
          <summary>Remove this trip</summary>
          <p className="muted" style={{ fontSize: ".9rem" }}>
            Deleting the trip also deletes its meals and packing list. Campsites and
            hikes survive — they simply stop pointing at a trip.
          </p>
          <form action={deleteTrip}>
            <input type="hidden" name="id" value={trip.id} />
            <button type="submit" className="btn btn-small">
              Delete “{trip.title}”
            </button>
          </form>
        </details>
      </div>
    </>
  );
}

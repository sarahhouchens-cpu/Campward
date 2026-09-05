import Link from "next/link";
import { LocationField } from "@/components/location-field";
import { createTrip, updateTrip } from "@/lib/actions";
import type { Trip } from "@/lib/types";

export function TripForm({ trip }: { trip?: Trip }) {
  const editing = Boolean(trip);

  return (
    <form action={editing ? updateTrip : createTrip} className="card stitched">
      {trip && <input type="hidden" name="id" value={trip.id} />}

      <div className="field">
        <label htmlFor="title">Trip name</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={trip?.title ?? ""}
          placeholder="Long weekend in the Smokies"
        />
      </div>

      <LocationField
        location={trip?.location}
        latitude={trip?.latitude}
        longitude={trip?.longitude}
      />

      <div className="field-row">
        <div>
          <label htmlFor="start_date">Arrive</label>
          <input id="start_date" name="start_date" type="date" defaultValue={trip?.start_date ?? ""} />
        </div>
        <div>
          <label htmlFor="end_date">Leave</label>
          <input id="end_date" name="end_date" type="date" defaultValue={trip?.end_date ?? ""} />
        </div>
        <div>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={trip?.status ?? "planned"}>
            <option value="planned">Planned</option>
            <option value="completed">Been there</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={trip?.notes ?? ""}
          placeholder="Reservation numbers, who's coming, the plan, what to remember for next time."
        />
      </div>

      <div className="row">
        <button type="submit" className="btn btn-primary">
          {editing ? "Save trip" : "Start the log"}
        </button>
        <Link href={trip ? `/trips/${trip.id}` : "/trips"} className="btn">
          Cancel
        </Link>
      </div>
    </form>
  );
}

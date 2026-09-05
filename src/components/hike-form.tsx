import { RatingInput } from "@/components/rating-input";
import { saveHike } from "@/lib/actions";
import type { Hike, Trip } from "@/lib/types";

export function HikeForm({
  hike,
  tripId,
  trips,
}: {
  hike?: Hike;
  tripId?: number;
  trips?: Trip[];
}) {
  const key = hike?.id ?? "new";

  return (
    <form action={saveHike} className="stack-sm">
      {hike && <input type="hidden" name="id" value={hike.id} />}
      {tripId != null && <input type="hidden" name="trip_id" value={tripId} />}

      <div className="field-row" style={{ marginTop: ".6rem" }}>
        <div>
          <label htmlFor={`hike-name-${key}`}>Trail</label>
          <input
            id={`hike-name-${key}`}
            name="name"
            type="text"
            required
            defaultValue={hike?.name ?? ""}
            placeholder="Boogerman Loop"
          />
        </div>
        <div>
          <label htmlFor={`hike-date-${key}`}>Walked</label>
          <input id={`hike-date-${key}`} name="hiked_on" type="date" defaultValue={hike?.hiked_on ?? ""} />
        </div>
      </div>

      {tripId == null && (
        <div className="field">
          <label htmlFor={`hike-trip-${key}`}>Trip</label>
          <select id={`hike-trip-${key}`} name="trip_id" defaultValue={hike?.trip_id ?? ""}>
            <option value="">Not tied to a trip</option>
            {(trips ?? []).map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field-row">
        <div>
          <label htmlFor={`hike-dist-${key}`}>Miles</label>
          <input
            id={`hike-dist-${key}`}
            name="distance_miles"
            type="number"
            step="0.1"
            min="0"
            defaultValue={hike?.distance_miles ?? ""}
            placeholder="7.4"
          />
        </div>
        <div>
          <label htmlFor={`hike-gain-${key}`}>Elevation gain (ft)</label>
          <input
            id={`hike-gain-${key}`}
            name="elevation_ft"
            type="number"
            step="10"
            min="0"
            defaultValue={hike?.elevation_ft ?? ""}
            placeholder="1400"
          />
        </div>
      </div>

      <RatingInput
        name="difficulty"
        legend="Difficulty"
        value={hike?.difficulty}
        labels={["stroll", "brutal"]}
      />
      <RatingInput
        name="views"
        legend="Views"
        value={hike?.views}
        labels={["trees only", "unbelievable"]}
      />

      <div className="field">
        <label className="check" htmlFor={`hike-repeat-${key}`}>
          <input
            id={`hike-repeat-${key}`}
            type="checkbox"
            name="would_repeat"
            defaultChecked={Boolean(hike?.would_repeat)}
          />
          Would do it again
        </label>
      </div>

      <div className="field">
        <label htmlFor={`hike-notes-${key}`}>Notes</label>
        <textarea
          id={`hike-notes-${key}`}
          name="notes"
          defaultValue={hike?.notes ?? ""}
          placeholder="Trail conditions, water crossings, where the good lunch rock is, what we'd do differently."
        />
      </div>

      <div>
        <button type="submit" className="btn btn-primary btn-small">
          {hike ? "Save hike" : "Add hike"}
        </button>
      </div>
    </form>
  );
}

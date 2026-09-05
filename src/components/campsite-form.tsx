import { LocationField } from "@/components/location-field";
import { RatingInput } from "@/components/rating-input";
import { saveCampsite } from "@/lib/actions";
import type { Campsite, Trip } from "@/lib/types";

export function CampsiteForm({
  campsite,
  tripId,
  trips,
}: {
  campsite?: Campsite;
  /** Pin the entry to one trip and hide the picker. */
  tripId?: number;
  /** Otherwise offer the whole list. */
  trips?: Trip[];
}) {
  return (
    <form action={saveCampsite} className="stack-sm">
      {campsite && <input type="hidden" name="id" value={campsite.id} />}
      {tripId != null && <input type="hidden" name="trip_id" value={tripId} />}

      <div className="field-row" style={{ marginTop: ".6rem" }}>
        <div>
          <label htmlFor={`site-name-${campsite?.id ?? "new"}`}>Site name</label>
          <input
            id={`site-name-${campsite?.id ?? "new"}`}
            name="name"
            type="text"
            required
            defaultValue={campsite?.name ?? ""}
            placeholder="Cataloochee, site 14"
          />
        </div>
        <div>
          <label htmlFor={`site-number-${campsite?.id ?? "new"}`}>Site #</label>
          <input
            id={`site-number-${campsite?.id ?? "new"}`}
            name="site_number"
            type="text"
            defaultValue={campsite?.site_number ?? ""}
            placeholder="14"
          />
        </div>
        <div>
          <label htmlFor={`site-date-${campsite?.id ?? "new"}`}>Stayed</label>
          <input
            id={`site-date-${campsite?.id ?? "new"}`}
            name="visited_on"
            type="date"
            defaultValue={campsite?.visited_on ?? ""}
          />
        </div>
      </div>

      {tripId == null && (
        <div className="field">
          <label htmlFor={`site-trip-${campsite?.id ?? "new"}`}>Trip</label>
          <select
            id={`site-trip-${campsite?.id ?? "new"}`}
            name="trip_id"
            defaultValue={campsite?.trip_id ?? ""}
          >
            <option value="">Not tied to a trip</option>
            {(trips ?? []).map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <LocationField
        location={campsite?.location}
        latitude={campsite?.latitude}
        longitude={campsite?.longitude}
      />

      <RatingInput
        name="rating"
        legend="Rating"
        value={campsite?.rating}
        labels={["wouldn't again", "perfect"]}
      />

      <div className="field">
        <label className="check" htmlFor={`site-return-${campsite?.id ?? "new"}`}>
          <input
            id={`site-return-${campsite?.id ?? "new"}`}
            type="checkbox"
            name="would_return"
            defaultChecked={Boolean(campsite?.would_return)}
          />
          We&rsquo;d stay here again
        </label>
      </div>

      <div className="field">
        <label htmlFor={`site-notes-${campsite?.id ?? "new"}`}>Notes</label>
        <textarea
          id={`site-notes-${campsite?.id ?? "new"}`}
          name="notes"
          defaultValue={campsite?.notes ?? ""}
          placeholder="Shade, level ground, water access, how close the neighbours were, whether the bear box actually latched."
        />
      </div>

      <div>
        <button type="submit" className="btn btn-primary btn-small">
          {campsite ? "Save site" : "Add site"}
        </button>
      </div>
    </form>
  );
}

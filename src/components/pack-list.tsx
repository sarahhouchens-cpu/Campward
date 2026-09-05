import Link from "next/link";
import { resetPacking, toggleGearOnTrip, togglePacked } from "@/lib/actions";
import { packList } from "@/lib/queries";
import type { PackListEntry } from "@/lib/types";

/**
 * Two views of the same table: what's on the list (checkable), and the rest of
 * the closet (addable). Every control is a form post, so this works with
 * JavaScript off and never desyncs from the database.
 */
export function PackList({ tripId }: { tripId: number }) {
  const everything = packList(tripId);
  const onList = everything.filter((g) => g.on_list);
  const available = everything.filter((g) => !g.on_list);
  const packed = onList.filter((g) => g.packed).length;

  const byCategory = onList.reduce<Record<string, PackListEntry[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="stack">
      {onList.length === 0 ? (
        <div className="empty">
          <p>Nothing on the list yet. Pull items out of the closet below.</p>
          {everything.length === 0 && (
            <Link href="/gear" className="btn btn-small">
              Add gear first
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="spread">
            <p className="hand" style={{ margin: 0 }}>
              {packed} of {onList.length} in the truck
            </p>
            {packed > 0 && (
              <form action={resetPacking}>
                <input type="hidden" name="trip_id" value={tripId} />
                <button type="submit" className="btn-plain">
                  Uncheck all
                </button>
              </form>
            )}
          </div>

          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              <p className="eyebrow" style={{ marginBottom: ".3rem" }}>
                {category}
              </p>
              <ul className="checklist">
                {items.map((item) => (
                  <li key={item.id}>
                    <form action={togglePacked} style={{ display: "flex", alignItems: "center" }}>
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="gear_id" value={item.id} />
                      <button
                        type="submit"
                        aria-label={item.packed ? `Unpack ${item.name}` : `Pack ${item.name}`}
                        style={{
                          border: "1.5px solid var(--rule-firm)",
                          borderRadius: "3px",
                          width: "1.05rem",
                          height: "1.05rem",
                          padding: 0,
                          cursor: "pointer",
                          lineHeight: 1,
                          fontSize: ".78rem",
                          background: item.packed ? "var(--moss)" : "transparent",
                          color: "var(--bone)",
                        }}
                      >
                        {item.packed ? "✓" : ""}
                      </button>
                    </form>
                    <span className={item.packed ? "packed grow" : "grow"}>
                      {item.name}
                      {item.quantity > 1 && <span className="faint"> ×{item.quantity}</span>}
                      {item.condition === "repair" && (
                        <span className="tag tag-dust" style={{ marginLeft: ".4rem" }}>
                          Needs repair
                        </span>
                      )}
                    </span>
                    <form action={toggleGearOnTrip}>
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="gear_id" value={item.id} />
                      <input type="hidden" name="on_list" value="1" />
                      <button type="submit" className="btn-plain" aria-label={`Remove ${item.name} from the list`}>
                        ×
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {available.length > 0 && (
        <details className="drawer">
          <summary>Add from the closet ({available.length})</summary>
          <ul className="checklist" style={{ marginTop: ".4rem" }}>
            {available.map((item) => (
              <li key={item.id}>
                <form action={toggleGearOnTrip} style={{ display: "contents" }}>
                  <input type="hidden" name="trip_id" value={tripId} />
                  <input type="hidden" name="gear_id" value={item.id} />
                  <input type="hidden" name="on_list" value="0" />
                  <button type="submit" className="btn-plain" aria-label={`Add ${item.name}`}>
                    ＋
                  </button>
                </form>
                <span className="grow">{item.name}</span>
                <span className="faint" style={{ fontSize: ".8rem" }}>
                  {item.category}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

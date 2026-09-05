import { deleteGear, saveGear } from "@/lib/actions";
import { GEAR_CATEGORIES, GEAR_CONDITIONS, type Gear } from "@/lib/types";

export function GearForm({ item }: { item?: Gear }) {
  const key = item?.id ?? "new";

  return (
    <>
      <form action={saveGear} className="stack-sm">
        {item && <input type="hidden" name="id" value={item.id} />}

        <div className="field-row" style={{ marginTop: ".6rem" }}>
          <div style={{ gridColumn: "span 2" }}>
            <label htmlFor={`gear-name-${key}`}>Item</label>
            <input
              id={`gear-name-${key}`}
              name="name"
              type="text"
              required
              defaultValue={item?.name ?? ""}
              placeholder="Copper Spur UL2"
            />
          </div>
          <div>
            <label htmlFor={`gear-cat-${key}`}>Category</label>
            <select id={`gear-cat-${key}`} name="category" defaultValue={item?.category ?? "Other"}>
              {GEAR_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div>
            <label htmlFor={`gear-cond-${key}`}>Condition</label>
            <select
              id={`gear-cond-${key}`}
              name="condition"
              defaultValue={item?.condition ?? "good"}
            >
              {GEAR_CONDITIONS.map((condition) => (
                <option key={condition.value} value={condition.value}>
                  {condition.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`gear-qty-${key}`}>Quantity</label>
            <input
              id={`gear-qty-${key}`}
              name="quantity"
              type="number"
              min="1"
              step="1"
              defaultValue={item?.quantity ?? 1}
            />
          </div>
          <div>
            <label htmlFor={`gear-weight-${key}`}>Weight (oz)</label>
            <input
              id={`gear-weight-${key}`}
              name="weight_oz"
              type="number"
              min="0"
              step="0.1"
              defaultValue={item?.weight_oz ?? ""}
              placeholder="51"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor={`gear-notes-${key}`}>Notes</label>
          <textarea
            id={`gear-notes-${key}`}
            name="notes"
            defaultValue={item?.notes ?? ""}
            style={{ minHeight: "4rem" }}
            placeholder="Where it lives, what needs fixing, what it replaced."
          />
        </div>

        <div>
          <button type="submit" className="btn btn-primary btn-small">
            {item ? "Save item" : "Add to the closet"}
          </button>
        </div>
      </form>

      {item && (
        <form action={deleteGear} style={{ marginTop: ".6rem" }}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="btn-plain">
            Delete this item
          </button>
        </form>
      )}
    </>
  );
}

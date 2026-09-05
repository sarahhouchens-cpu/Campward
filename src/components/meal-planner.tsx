import {
  addMeal,
  addMealItem,
  deleteMeal,
  deleteMealItem,
  toggleMealItem,
} from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { mealsForTrip, shoppingList } from "@/lib/queries";
import { MEAL_SLOTS } from "@/lib/types";

const SLOT_LABEL = Object.fromEntries(MEAL_SLOTS.map((s) => [s.value, s.label]));

/**
 * Meals per trip, and the shopping list that falls out of their ingredients.
 * Ingredients are checked off as they're bought or packed — one list serves the
 * grocery run and the cooler load.
 */
export function MealPlanner({
  tripId,
  startDate,
}: {
  tripId: number;
  startDate: string | null;
}) {
  const meals = mealsForTrip(tripId);
  const shopping = shoppingList(tripId);
  const remaining = shopping.filter((item) => !item.packed);

  return (
    <div className="stack">
      {meals.length === 0 ? (
        <div className="empty">
          <p>No meals planned. Add the dinners first — they&rsquo;re the ones that need real ingredients.</p>
        </div>
      ) : (
        <div className="stack-sm">
          {meals.map((meal) => (
            <article key={meal.id} className="card card-quiet">
              <div className="spread">
                <div>
                  <span className="tag tag-sage">{SLOT_LABEL[meal.slot] ?? meal.slot}</span>{" "}
                  <strong style={{ marginLeft: ".3rem" }}>{meal.name}</strong>
                  {meal.day && (
                    <div className="faint" style={{ fontSize: ".82rem" }}>
                      {formatDate(meal.day)}
                    </div>
                  )}
                </div>
                <form action={deleteMeal}>
                  <input type="hidden" name="id" value={meal.id} />
                  <input type="hidden" name="trip_id" value={tripId} />
                  <button type="submit" className="btn-plain" aria-label={`Remove ${meal.name}`}>
                    ×
                  </button>
                </form>
              </div>

              {meal.notes && (
                <p className="muted" style={{ margin: ".4rem 0 0", fontSize: ".9rem" }}>
                  {meal.notes}
                </p>
              )}

              {meal.items.length > 0 && (
                <ul className="checklist" style={{ marginTop: ".55rem" }}>
                  {meal.items.map((item) => (
                    <li key={item.id}>
                      <form action={toggleMealItem} style={{ display: "contents" }}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="trip_id" value={tripId} />
                        <button
                          type="submit"
                          className="btn-plain"
                          aria-label={item.packed ? `Unmark ${item.item}` : `Mark ${item.item} bought`}
                        >
                          {item.packed ? "✓" : "○"}
                        </button>
                      </form>
                      <span className={item.packed ? "packed grow" : "grow"}>
                        {item.item}
                        {item.quantity && <span className="faint"> — {item.quantity}</span>}
                      </span>
                      <form action={deleteMealItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="trip_id" value={tripId} />
                        <button type="submit" className="btn-plain" aria-label={`Delete ${item.item}`}>
                          ×
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <form action={addMealItem} className="row" style={{ marginTop: ".55rem", flexWrap: "nowrap" }}>
                <input type="hidden" name="meal_id" value={meal.id} />
                <input type="hidden" name="trip_id" value={tripId} />
                <input
                  name="item"
                  type="text"
                  className="grow"
                  placeholder="Ingredient"
                  aria-label={`Ingredient for ${meal.name}`}
                />
                <input
                  name="quantity"
                  type="text"
                  placeholder="How much"
                  aria-label="Quantity"
                  style={{ maxWidth: "8.5rem" }}
                />
                <button type="submit" className="btn btn-small">
                  Add
                </button>
              </form>
            </article>
          ))}
        </div>
      )}

      <details className="drawer">
        <summary>Plan a meal</summary>
        <form action={addMeal} className="stack-sm" style={{ marginTop: ".5rem" }}>
          <input type="hidden" name="trip_id" value={tripId} />
          <div className="field-row">
            <div style={{ gridColumn: "span 2" }}>
              <label htmlFor="meal-name">Meal</label>
              <input
                id="meal-name"
                name="name"
                type="text"
                required
                placeholder="Chili and cornbread in the dutch oven"
              />
            </div>
            <div>
              <label htmlFor="meal-slot">When</label>
              <select id="meal-slot" name="slot" defaultValue="dinner">
                {MEAL_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="meal-day">Day</label>
              <input id="meal-day" name="day" type="date" defaultValue={startDate ?? ""} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="meal-notes">Notes</label>
            <textarea
              id="meal-notes"
              name="notes"
              style={{ minHeight: "3.5rem" }}
              placeholder="Prep at home, cook time, what pot it needs."
            />
          </div>
          <div>
            <button type="submit" className="btn btn-primary btn-small">
              Add meal
            </button>
          </div>
        </form>
      </details>

      {shopping.length > 0 && (
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: ".5rem" }}>
            Shopping list — {remaining.length} left to buy
          </p>
          <ul className="checklist">
            {shopping.map((item) => (
              <li key={item.id}>
                <form action={toggleMealItem} style={{ display: "contents" }}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="trip_id" value={tripId} />
                  <button type="submit" className="btn-plain" aria-label={`Toggle ${item.item}`}>
                    {item.packed ? "✓" : "○"}
                  </button>
                </form>
                <span className={item.packed ? "packed grow" : "grow"}>
                  {item.item}
                  {item.quantity && <span className="faint"> — {item.quantity}</span>}
                </span>
                <span className="faint" style={{ fontSize: ".78rem" }}>
                  {item.meal_name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

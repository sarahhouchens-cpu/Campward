import { GearForm } from "@/components/gear-form";
import { PackIcon } from "@/components/icons";
import { listGear } from "@/lib/queries";
import { GEAR_CONDITIONS, type Gear } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gear — Campward" };

const CONDITION_LABEL = Object.fromEntries(
  GEAR_CONDITIONS.map((c) => [c.value, c.label]),
) as Record<string, string>;

function conditionTag(item: Gear) {
  if (item.retired) return "tag";
  if (item.condition === "repair") return "tag tag-dust";
  if (item.condition === "new") return "tag tag-moss";
  return "tag tag-sage";
}

export default function GearPage() {
  const gear = listGear();
  const active = gear.filter((g) => !g.retired);
  const retired = gear.filter((g) => g.retired);
  const needsRepair = active.filter((g) => g.condition === "repair");

  const byCategory = active.reduce<Record<string, Gear[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const totalWeight = active.reduce(
    (sum, item) => sum + (item.weight_oz ?? 0) * item.quantity,
    0,
  );

  return (
    <>
      <header style={{ marginTop: "1.5rem", marginBottom: "1.4rem" }}>
        <p className="eyebrow">Gear</p>
        <h1 style={{ margin: 0 }}>The closet</h1>
        <p className="lede" style={{ marginTop: ".5rem" }}>
          {active.length === 0
            ? "Everything you own, so the packing list can build itself."
            : `${active.length} items in rotation${
                totalWeight > 0 ? `, ${(totalWeight / 16).toFixed(1)} lb all told` : ""
              }.`}
        </p>
      </header>

      {needsRepair.length > 0 && (
        <div className="alert" style={{ marginBottom: "1.4rem" }}>
          <p style={{ margin: 0 }}>
            <strong>Needs attention before the next trip:</strong>{" "}
            {needsRepair.map((g) => g.name).join(", ")}.
          </p>
        </div>
      )}

      <details className="drawer card card-quiet" style={{ marginBottom: "1.6rem" }}>
        <summary>Add gear</summary>
        <GearForm />
      </details>

      {active.length === 0 ? (
        <div className="empty">
          <p>Nothing in the closet yet. Add the big things first — tent, bags, pads, stove.</p>
        </div>
      ) : (
        Object.entries(byCategory).map(([category, items]) => (
          <section key={category} className="section" style={{ marginTop: "1.8rem" }}>
            <header className="row-tight" style={{ marginBottom: ".7rem" }}>
              <PackIcon size={19} />
              <h2 style={{ margin: 0 }}>{category}</h2>
              <span className="faint" style={{ fontSize: ".85rem" }}>
                {items.length}
              </span>
            </header>

            <div className="card">
              <ul className="entries">
                {items.map((item) => (
                  <li key={item.id}>
                    {/* The whole row opens the editor — a repeated "Edit" link
                        under every item would drown out the inventory itself. */}
                    <details className="drawer">
                      <summary className="row-summary">
                        <span>
                          <strong className="row-name">{item.name}</strong>
                          {item.quantity > 1 && (
                            <span className="faint"> ×{item.quantity}</span>
                          )}
                          {item.notes && (
                            <span className="muted" style={{ display: "block", fontSize: ".89rem" }}>
                              {item.notes}
                            </span>
                          )}
                        </span>
                        <span className="row-tight">
                          {item.weight_oz != null && (
                            <span className="faint" style={{ fontSize: ".84rem" }}>
                              {item.weight_oz} oz
                            </span>
                          )}
                          <span className={conditionTag(item)}>
                            {CONDITION_LABEL[item.condition] ?? item.condition}
                          </span>
                        </span>
                      </summary>
                      <GearForm item={item} />
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))
      )}

      {retired.length > 0 && (
        <details className="drawer" style={{ marginTop: "2rem" }}>
          <summary>Retired gear ({retired.length})</summary>
          <div className="card card-quiet" style={{ marginTop: ".6rem" }}>
            <ul className="entries">
              {retired.map((item) => (
                <li key={item.id}>
                  <details className="drawer">
                    <summary className="row-summary">
                      <span className="muted row-name">{item.name}</span>
                      <span className="tag">Retired</span>
                    </summary>
                    <GearForm item={item} />
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </>
  );
}

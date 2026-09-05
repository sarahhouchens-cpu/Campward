/**
 * A 1–5 pick rendered as radio buttons — no JavaScript, works in a plain form
 * post, and keyboard-navigable for free.
 */
export function RatingInput({
  name,
  legend,
  value,
  labels,
}: {
  name: string;
  legend: string;
  value?: number | null;
  labels?: [string, string];
}) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="rating-input">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>
            <input
              type="radio"
              id={`${name}-${n}`}
              name={name}
              value={n}
              defaultChecked={value === n}
            />
            <label htmlFor={`${name}-${n}`}>{n}</label>
          </span>
        ))}
        {labels && (
          <small className="faint" style={{ marginLeft: ".4rem" }}>
            {labels[0]} → {labels[1]}
          </small>
        )}
      </div>
    </fieldset>
  );
}

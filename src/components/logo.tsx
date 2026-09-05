/**
 * The Campward mark: a tent with a strand of string lights.
 *
 * Redrawn from public/logo/campward-logo-compact.svg as a component so it can
 * scale, switch to the on-dark treatment, and sit inline with live text in the
 * production serif — rather than shipping a rasterised wordmark.
 * Geometry is the supplied artwork's, translated into a 0-based viewBox.
 */

type Tone = "color" | "onDark";

export function CampwardMark({
  size = 40,
  tone = "color",
  className,
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  const dark = tone === "onDark";
  const ink = dark ? "#F4EFE4" : "#3F4E3B";

  return (
    <svg
      width={size}
      height={(size * 66) / 60}
      viewBox="0 0 60 66"
      fill="none"
      className={className}
      aria-hidden
      focusable={false}
    >
      {/* Tent */}
      <polygon
        points="30,3 58,63 2,63"
        fill={dark ? "none" : "#8A9A5B"}
        stroke={ink}
        strokeWidth={dark ? 2 : 1.5}
        strokeLinejoin="round"
      />
      <line x1="30" y1="3" x2="30" y2="63" stroke={ink} strokeWidth={dark ? 2 : 1.5} />

      {/* Strand */}
      <path d="M 6 11 Q 30 25 54 11" fill="none" stroke={dark ? ink : "#A87C4F"} strokeWidth={1.2} />

      {/* Bulbs */}
      {[
        [12, 15],
        [24, 22],
        [36, 22],
        [48, 15],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={3}
          fill="#F4EFE4"
          stroke={dark ? "none" : ink}
          strokeWidth={0.8}
        />
      ))}
    </svg>
  );
}

/**
 * Horizontal lockup: mark, wordmark in the production serif, brand tagline.
 * The stacked artwork in public/logo suits a hero; a masthead needs this.
 */
export function CampwardLockup({
  tone = "color",
  size = 40,
  tagline = true,
}: {
  tone?: Tone;
  size?: number;
  tagline?: boolean;
}) {
  return (
    <span className="lockup" data-tone={tone}>
      <CampwardMark size={size} tone={tone} />
      <span>
        <span className="lockup-word">Campward</span>
        {tagline && <span className="lockup-tag">Plan · Pack · Go</span>}
      </span>
    </span>
  );
}

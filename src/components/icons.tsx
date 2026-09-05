/**
 * Hand-cut icon set. These are drawn as slightly irregular shapes with uneven
 * stroke weights so they read like a linocut print rather than a UI icon font.
 * Keep new ones in the same voice: no perfect circles, no uniform 2px strokes.
 */

type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false as const,
});

export function TentIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3.4 3.1 19.4h17.6L12 3.4Z" strokeWidth={2} />
      <path d="M12 6.8 8.1 19.3h7.7L12 6.8Z" />
      <path d="M1.6 19.5h20.9" strokeWidth={2.2} />
    </svg>
  );
}

export function PeakIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M2.2 19.3 9 6.4l4.1 7.3 2.2-3.1 6.4 8.7H2.2Z" strokeWidth={2} />
      <path d="m7.1 10 1.9 1.7 2-1.4" />
    </svg>
  );
}

export function PackIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6.3 8.3c0-2.4 2.4-4.1 5.7-4.1s5.8 1.7 5.8 4.1v9.3c0 1.4-.9 2.3-2.4 2.3H8.6c-1.5 0-2.3-.9-2.3-2.3V8.3Z" strokeWidth={2} />
      <path d="M9.4 4.6V3.2c0-.8.6-1.3 1.4-1.3h2.3c.9 0 1.4.5 1.4 1.3v1.5" />
      <path d="M9.1 11.8h5.9M9.3 15.3h5.6" />
    </svg>
  );
}

export function PineIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2.3 7.4 9.1h2.2L6.3 14h2.8l-3.4 4.6h13L15.2 14h2.7l-3.4-4.9h2.3L12 2.3Z" strokeWidth={1.9} />
      <path d="M12 18.7v3.1" strokeWidth={2.2} />
    </svg>
  );
}

export function CloudIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7.2 17.2c-2.5 0-4.3-1.6-4.2-3.7.1-2 1.7-3.3 3.7-3.3.4-2.7 2.6-4.5 5.4-4.4 2.6.1 4.5 1.8 4.9 4.1 2.2.1 3.7 1.5 3.7 3.5s-1.7 3.8-4.2 3.8H7.2Z" strokeWidth={2} />
      <path d="M8.4 20.4l-.9 1.5M12.2 20.3l-.8 1.6M16 20.4l-.9 1.5" />
    </svg>
  );
}

export function PotIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.4 9.4h15.2v6.2c0 2.2-1.6 3.9-3.9 3.9H8.2c-2.2 0-3.8-1.7-3.8-3.9V9.4Z" strokeWidth={2} />
      <path d="M3.1 9.3h17.8" strokeWidth={2.2} />
      <path d="M19.7 11.4c1.4 0 2.1.8 2 2.1-.1 1.2-.9 1.9-2.1 1.9" />
      <path d="M8.7 6.4c.7-.8.6-1.6-.1-2.5M12.1 6.3c.8-.9.7-1.8-.1-2.7M15.5 6.4c.7-.8.6-1.6-.1-2.5" />
    </svg>
  );
}

export function CompassIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2.6c5.1 0 9.3 4.2 9.3 9.4s-4.2 9.4-9.3 9.4S2.6 17.2 2.6 12 6.8 2.6 12 2.6Z" strokeWidth={2} />
      <path d="m15.6 8.3-2 5.5-5.4 2.1 2-5.5 5.4-2.1Z" />
    </svg>
  );
}

export function StarIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable={false}
      className={className}
    >
      <path d="M12 2.4 14.9 8.7l6.8.8-5.1 4.7 1.4 6.8L12 17.6 5.9 21l1.5-6.8-5.1-4.7 6.9-.8L12 2.4Z" />
    </svg>
  );
}

/** Filled marks out of five — used everywhere a rating is displayed. */
export function Rating({
  value,
  max = 5,
  label,
}: {
  value: number | null;
  max?: number;
  label?: string;
}) {
  if (value == null) return <span className="faint">—</span>;
  return (
    <span className="rating" title={`${value} of ${max}${label ? ` ${label}` : ""}`}>
      {Array.from({ length: max }, (_, i) => (
        <StarIcon key={i} className={i < value ? undefined : "off"} />
      ))}
      <span className="sr-only" style={{ position: "absolute", left: -9999 }}>
        {value} of {max}
      </span>
    </span>
  );
}

/**
 * Icon set, drawn to match the Campward mark: even line weights, flat
 * geometric shapes, sage fills against moss line work. The logo is crisp
 * rather than sketchy, so these are too — an irregular hand-drawn set would
 * read as a different brand sitting next to it.
 *
 * Fills use the palette directly; strokes use currentColor so an icon takes
 * the colour of the text it sits beside.
 */

type IconProps = { size?: number; className?: string };

const SAGE = "#8A9A5B";
const BONE = "#F4EFE4";
const DUST = "#A87C4F";

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false as const,
});

/** The tent from the mark, without the strand. */
export function TentIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polygon points="12,3 21.5,20.5 2.5,20.5" fill={SAGE} />
      <line x1="12" y1="3" x2="12" y2="20.5" />
    </svg>
  );
}

/* Two summits, so it can't be mistaken for the tent at header size. */
export function PeakIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polygon points="8.5,4 15,20.5 2,20.5" fill={SAGE} />
      <polygon points="16,9 22,20.5 10,20.5" fill={SAGE} />
      <polyline points="5.7,10.4 8.5,12.6 11.3,10.4" />
    </svg>
  );
}

export function PineIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polygon points="12,2.5 17,10 7,10" fill={SAGE} />
      <polygon points="12,8 18.5,17.5 5.5,17.5" fill={SAGE} />
      <line x1="12" y1="17.5" x2="12" y2="21.5" />
    </svg>
  );
}

export function PackIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="5.5" y="7" width="13" height="13.5" rx="3" fill={SAGE} />
      <path d="M9.5 7V4.6a1.4 1.4 0 0 1 1.4-1.4h2.2a1.4 1.4 0 0 1 1.4 1.4V7" />
      <line x1="9" y1="12.5" x2="15" y2="12.5" />
    </svg>
  );
}

/** A bulb from the strand — the logo's warm-glow motif at icon scale. */
export function LightIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 6.5Q12 14 21 6.5" stroke={DUST} />
      <circle cx="7.5" cy="10.4" r="2.6" fill={BONE} />
      <circle cx="16.5" cy="10.4" r="2.6" fill={BONE} />
      <circle cx="12" cy="12.6" r="2.6" fill={BONE} />
    </svg>
  );
}

export function CloudIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M7.2 16.5a3.7 3.7 0 0 1 -.4 -7.4 5 5 0 0 1 9.7 -1 3.6 3.6 0 0 1 -.3 8.4Z"
        fill={SAGE}
      />
      <path d="M8.4 19.4 7.6 21M12.2 19.3l-.8 1.6M16 19.4l-.8 1.6" />
    </svg>
  );
}

export function PotIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 10h15v5.6a4 4 0 0 1 -4 4h-7a4 4 0 0 1 -4 -4Z" fill={SAGE} />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M19.6 12.2a2 2 0 0 1 0 4" />
      <path d="M9 7.2c.7-.9.6-1.7 0-2.6M12.4 7.2c.7-.9.6-1.7 0-2.6M15.8 7.2c.7-.9.6-1.7 0-2.6" />
    </svg>
  );
}

export function CompassIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9.2" fill={SAGE} />
      <polygon points="15.8,8.2 13.6,13.8 8.2,15.8 10.4,10.2" fill={BONE} />
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
      <span style={{ position: "absolute", left: -9999 }}>
        {value} of {max}
      </span>
    </span>
  );
}

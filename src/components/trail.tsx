"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TRAIL = [
  { href: "/", label: "Logbook" },
  { href: "/trips", label: "Trips" },
  { href: "/campsites", label: "Campsites" },
  { href: "/hikes", label: "Hikes" },
  { href: "/gear", label: "Gear" },
];

export function Trail() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="trail">
      {TRAIL.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} data-active={active}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

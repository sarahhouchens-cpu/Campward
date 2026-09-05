import type { Metadata } from "next";
import { Caveat, Fraunces, Karla } from "next/font/google";
import Link from "next/link";
import { CampwardLockup } from "@/components/logo";
import { Trail } from "@/components/trail";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK"],
  variable: "--font-fraunces",
});

const karla = Karla({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-karla",
});

const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Campward — field logbook",
  description: "Trips, campsites, hikes, gear, weather and meals, kept in one logbook.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable} ${caveat.variable}`}>
      <body>
        <header className="masthead">
          <div className="masthead-inner">
            <Link href="/" className="lockup-link" aria-label="Campward — home">
              <CampwardLockup />
            </Link>
            <Trail />
          </div>
          <div className="lights" aria-hidden />
        </header>

        <main className="shell">{children}</main>

        <footer className="footer-band">
          <div className="lights lights-dark" aria-hidden style={{ marginTop: 0 }} />
          <div className="footer-band-inner">
            <CampwardLockup tone="onDark" size={34} />
            <p>
              Everything lives in one SQLite file on this machine. Nothing leaves it
              except weather and geocoding lookups.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

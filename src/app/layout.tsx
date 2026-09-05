import type { Metadata } from "next";
import { Caveat, Fraunces, Karla } from "next/font/google";
import Link from "next/link";
import { PineIcon } from "@/components/icons";
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
            <Link href="/" className="wordmark">
              <PineIcon size={34} />
              <span>
                <strong>Campward</strong>
                <span className="tagline">a field logbook</span>
              </span>
            </Link>
            <Trail />
          </div>
        </header>

        <main className="shell">{children}</main>
      </body>
    </html>
  );
}

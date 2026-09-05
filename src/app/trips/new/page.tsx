import Link from "next/link";
import { TripForm } from "@/components/trip-form";

export const metadata = { title: "New trip — Campward" };

export default function NewTripPage() {
  return (
    <>
      <Link href="/trips" className="crumb">
        ← Trips
      </Link>
      <h1>A new trip</h1>
      <p className="lede" style={{ marginBottom: "1.6rem" }}>
        Name and dates are enough to start. Everything else — sites, hikes, packing,
        meals — hangs off the trip once it exists.
      </p>
      <div style={{ maxWidth: "44rem" }}>
        <TripForm />
      </div>
    </>
  );
}

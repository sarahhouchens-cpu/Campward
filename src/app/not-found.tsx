import Link from "next/link";
import { CompassIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div style={{ marginTop: "3rem", maxWidth: "34rem" }}>
      <CompassIcon size={44} />
      <h1>Off the map</h1>
      <p className="lede">
        There&rsquo;s no page here. Probably a trip that got deleted, or a link that
        went stale.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to the logbook
      </Link>
    </div>
  );
}

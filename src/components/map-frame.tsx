/**
 * A small OpenStreetMap window. An iframe rather than a mapping library: it is
 * one element, needs no client bundle, and a personal logbook only ever needs
 * to answer "roughly where was this?".
 */
export function MapFrame({
  latitude,
  longitude,
  label,
  span = 0.045,
}: {
  latitude: number;
  longitude: number;
  label?: string;
  span?: number;
}) {
  const bbox = [
    longitude - span,
    latitude - span / 2,
    longitude + span,
    latitude + span / 2,
  ]
    .map((n) => n.toFixed(5))
    .join(",");

  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
    `&layer=mapnik&marker=${latitude.toFixed(5)},${longitude.toFixed(5)}`;

  return (
    <div className="map-frame">
      <iframe
        src={src}
        title={label ? `Map of ${label}` : "Map"}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

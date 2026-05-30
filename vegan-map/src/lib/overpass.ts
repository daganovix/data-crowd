import { Place, PlaceKind, VeganLevel } from "../types";

/** Public Overpass instances. We try them in order if one is busy/unreachable. */
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function kindFromTags(tags: Record<string, string>): PlaceKind {
  switch (tags.amenity) {
    case "restaurant":
      return "restaurant";
    case "cafe":
      return "cafe";
    case "fast_food":
      return "fast_food";
    case "bar":
      return "bar";
    case "pub":
      return "pub";
    case "ice_cream":
      return "ice_cream";
    default:
      return "other";
  }
}

function veganLevel(tags: Record<string, string>): VeganLevel {
  const v = (tags["diet:vegan"] || "").toLowerCase();
  if (v === "only") return "only";
  if (v === "yes" || v === "limited") return "yes";
  // Some places are tagged purely as vegan via cuisine.
  if ((tags.cuisine || "").toLowerCase().includes("vegan")) return "only";
  return "unknown";
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" "),
    [tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" "),
    tags["addr:country"],
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

function toPlace(el: OverpassElement): Place | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) return null;

  const tags = el.tags ?? {};
  const name = tags.name || tags["name:en"] || "Unnamed vegan spot";

  return {
    id: `${el.type}/${el.id}`,
    osmType: el.type,
    osmId: el.id,
    lat,
    lng,
    name,
    kind: kindFromTags(tags),
    vegan: veganLevel(tags),
    cuisine: tags.cuisine?.replace(/[_;]/g, " ").trim() || undefined,
    address: buildAddress(tags),
    website: tags.website || tags["contact:website"] || undefined,
    phone: tags.phone || tags["contact:phone"] || undefined,
    openingHours: tags.opening_hours || undefined,
  };
}

/**
 * Fetch vegan (and vegan-friendly) eateries within the given bounds.
 * Pulls amenities tagged with `diet:vegan=yes|only|limited`.
 */
export async function fetchVeganPlaces(
  bounds: Bounds,
  signal?: AbortSignal
): Promise<Place[]> {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  const query = `[out:json][timeout:25];
(
  nwr["diet:vegan"~"yes|only|limited",i]["amenity"~"restaurant|cafe|fast_food|bar|pub|ice_cream"](${bbox});
);
out center tags 600;`;

  let lastError: unknown;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
      });
      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status}`);
        continue;
      }
      const data: { elements?: OverpassElement[] } = await res.json();
      const places = (data.elements ?? [])
        .map(toPlace)
        .filter((p): p is Place => p !== null);

      // De-duplicate by id (a place can occasionally appear twice).
      const seen = new Map<string, Place>();
      for (const p of places) seen.set(p.id, p);
      return [...seen.values()];
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
    }
  }
  throw lastError ?? new Error("All Overpass endpoints failed");
}

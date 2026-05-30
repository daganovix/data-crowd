export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
  /** [south, north, west, east] when supplied by Nominatim. */
  boundingbox?: [number, number, number, number];
}

/**
 * Look up a city/place name using OpenStreetMap's Nominatim service.
 * Results are biased towards Europe.
 */
export async function geocode(
  query: string,
  signal?: AbortSignal
): Promise<GeocodeResult[]> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&limit=6&accept-language=en&q=" +
    encodeURIComponent(query);

  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Geocoder ${res.status}`);

  const data: Array<{
    display_name: string;
    lat: string;
    lon: string;
    boundingbox?: [string, string, string, string];
  }> = await res.json();

  return data.map((d) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    boundingbox: d.boundingbox
      ? (d.boundingbox.map(parseFloat) as [number, number, number, number])
      : undefined,
  }));
}

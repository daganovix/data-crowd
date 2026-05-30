export type PlaceKind =
  | "restaurant"
  | "cafe"
  | "fast_food"
  | "bar"
  | "pub"
  | "ice_cream"
  | "other";

export type VeganLevel = "only" | "yes" | "unknown";

/** A place discovered from OpenStreetMap. */
export interface Place {
  /** Stable id, e.g. "node/123456". Used as the key for user data too. */
  id: string;
  osmType: "node" | "way" | "relation";
  osmId: number;
  lat: number;
  lng: number;
  name: string;
  kind: PlaceKind;
  /** Whether the place is fully vegan ("only") or vegan-friendly ("yes"). */
  vegan: VeganLevel;
  cuisine?: string;
  address?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
}

/** Everything the user records about a place. Persisted in localStorage. */
export interface UserPlaceData {
  visited: boolean;
  /** 0 = unrated, otherwise 1–5. */
  rating: number;
  notes: string;
  wantToVisit: boolean;
  updatedAt: number;
  /** Cached snapshot so saved places render without re-fetching from OSM. */
  place: Place;
}

export type UserData = Record<string, UserPlaceData>;

export const KIND_LABEL: Record<PlaceKind, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  fast_food: "Fast food",
  bar: "Bar",
  pub: "Pub",
  ice_cream: "Ice cream",
  other: "Place",
};

export const KIND_EMOJI: Record<PlaceKind, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  fast_food: "🥪",
  bar: "🍹",
  pub: "🍺",
  ice_cream: "🍦",
  other: "🌱",
};

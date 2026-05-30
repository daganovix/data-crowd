import { useMemo } from "react";
import { Bookmark, Check, Loader2, MapPinned, Search, Star } from "lucide-react";
import { KIND_EMOJI, KIND_LABEL, Place } from "../types";
import { useUserData } from "../store/UserDataContext";
import { distanceKm, formatDistance, LatLng } from "../lib/distance";

export type Tab = "discover" | "saved" | "visited";

interface Props {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  discoverPlaces: Place[];
  loading: boolean;
  error: string | null;
  zoomedEnough: boolean;
  selectedId?: string;
  userLoc: LatLng | null;
  onSelect: (place: Place) => void;
}

function StatusIcons({ id }: { id: string }) {
  const { get } = useUserData();
  const e = get(id);
  if (!e) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {e.rating > 0 && (
        <span className="inline-flex items-center gap-0.5 font-semibold text-amber-500">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          {e.rating}
        </span>
      )}
      {e.visited && <Check size={14} className="text-leaf-600" />}
      {e.wantToVisit && <Bookmark size={13} className="fill-amber-400 text-amber-500" />}
    </div>
  );
}

function PlaceRow({
  place,
  selected,
  userLoc,
  onSelect,
}: {
  place: Place;
  selected: boolean;
  userLoc: LatLng | null;
  onSelect: (p: Place) => void;
}) {
  const dist = userLoc ? distanceKm(userLoc, place) : null;
  return (
    <button
      onClick={() => onSelect(place)}
      className={
        "flex w-full items-center gap-3 border-b border-leaf-50 px-4 py-3 text-left transition hover:bg-leaf-50 " +
        (selected ? "bg-leaf-100" : "")
      }
    >
      <span className="text-xl" aria-hidden>
        {KIND_EMOJI[place.kind]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-leaf-900">{place.name}</span>
        <span className="block truncate text-xs text-leaf-500">
          {KIND_LABEL[place.kind]}
          {place.vegan === "only" ? " · 100% vegan" : " · vegan options"}
          {dist !== null && ` · ${formatDistance(dist)}`}
          {place.address ? ` · ${place.address}` : ""}
        </span>
      </span>
      <StatusIcons id={place.id} />
    </button>
  );
}

function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-leaf-500">
      <div className="mb-3 text-leaf-300">{icon}</div>
      <p className="font-medium text-leaf-700">{title}</p>
      <p className="mt-1 text-sm">{hint}</p>
    </div>
  );
}

export default function Sidebar({
  tab,
  onTabChange,
  discoverPlaces,
  loading,
  error,
  zoomedEnough,
  selectedId,
  userLoc,
  onSelect,
}: Props) {
  const { data } = useUserData();

  const byDistance = (a: Place, b: Place) =>
    distanceKm(userLoc!, a) - distanceKm(userLoc!, b);

  const savedPlaces = useMemo(
    () =>
      Object.values(data)
        .filter((e) => e.wantToVisit)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((e) => e.place)
        .sort(userLoc ? byDistance : () => 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, userLoc]
  );

  const visitedPlaces = useMemo(
    () =>
      Object.values(data)
        .filter((e) => e.visited)
        .sort((a, b) => b.rating - a.rating || b.updatedAt - a.updatedAt)
        .map((e) => e.place),
    [data]
  );

  const sortedDiscover = useMemo(
    () =>
      [...discoverPlaces].sort(
        userLoc ? byDistance : (a, b) => a.name.localeCompare(b.name)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [discoverPlaces, userLoc]
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "discover", label: "Discover", count: discoverPlaces.length },
    { key: "saved", label: "Want to visit", count: savedPlaces.length },
    { key: "visited", label: "Visited", count: visitedPlaces.length },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex border-b border-leaf-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={
              "relative flex-1 px-2 py-3 text-sm font-semibold transition " +
              (tab === t.key
                ? "text-leaf-700"
                : "text-leaf-400 hover:text-leaf-600")
            }
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 text-xs font-normal text-leaf-400">({t.count})</span>
            )}
            {tab === t.key && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-leaf-600" />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="vm-scroll flex-1 overflow-y-auto">
        {tab === "discover" && (
          <>
            {!zoomedEnough && !loading && (
              <EmptyState
                icon={<Search size={40} />}
                title="Zoom in to discover places"
                hint="Pan and zoom the map (or search a city) to load vegan spots nearby."
              />
            )}
            {loading && (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-leaf-500">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Loading vegan spots…</span>
              </div>
            )}
            {error && !loading && (
              <div className="m-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {!loading && zoomedEnough && !error && sortedDiscover.length === 0 && (
              <EmptyState
                icon={<MapPinned size={40} />}
                title="No vegan spots here"
                hint="Try moving the map or zooming out a little to widen the search."
              />
            )}
            {sortedDiscover.map((p) => (
              <PlaceRow
                key={p.id}
                place={p}
                selected={p.id === selectedId}
                userLoc={userLoc}
                onSelect={onSelect}
              />
            ))}
          </>
        )}

        {tab === "saved" &&
          (savedPlaces.length === 0 ? (
            <EmptyState
              icon={<Bookmark size={40} />}
              title="Nothing saved yet"
              hint="Open a place and tap “Want to visit” to build your wishlist."
            />
          ) : (
            savedPlaces.map((p) => (
              <PlaceRow key={p.id} place={p} selected={p.id === selectedId} userLoc={userLoc} onSelect={onSelect} />
            ))
          ))}

        {tab === "visited" &&
          (visitedPlaces.length === 0 ? (
            <EmptyState
              icon={<Check size={40} />}
              title="No visits logged"
              hint="Mark places as visited and rate them to keep a personal diary."
            />
          ) : (
            visitedPlaces.map((p) => (
              <PlaceRow key={p.id} place={p} selected={p.id === selectedId} userLoc={userLoc} onSelect={onSelect} />
            ))
          ))}
      </div>
    </div>
  );
}

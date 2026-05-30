import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { KIND_EMOJI, Place } from "../types";
import { Bounds } from "../lib/overpass";
import { useUserData } from "../store/UserDataContext";

export interface Focus {
  lat: number;
  lng: number;
  zoom?: number;
  nonce: number;
}

interface Props {
  places: Place[];
  selectedId?: string;
  onSelect: (place: Place) => void;
  onBoundsChange: (bounds: Bounds, zoom: number) => void;
  focus: Focus | null;
}

type MarkerStatus = "visited" | "saved" | "discover";

const STATUS_COLOR: Record<MarkerStatus, string> = {
  visited: "#3c7724", // leaf-600
  saved: "#f59e0b", // amber-500
  discover: "#6cb04d", // leaf-400
};

const iconCache = new Map<string, L.DivIcon>();

function pinIcon(status: MarkerStatus, emoji: string, selected: boolean): L.DivIcon {
  const key = `${status}|${emoji}|${selected}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const size = selected ? 38 : 30;
  const ring = selected ? "box-shadow:0 0 0 3px rgba(60,119,36,.35),0 2px 6px rgba(0,0,0,.35);" : "";
  const icon = L.divIcon({
    className: "",
    html: `<div class="vm-pin" style="background:${STATUS_COLOR[status]};width:${size}px;height:${size}px;${ring}"><span>${emoji}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
  iconCache.set(key, icon);
  return icon;
}

function BoundsWatcher({ onChange }: { onChange: Props["onBoundsChange"] }) {
  const report = (map: L.Map) => {
    const b = map.getBounds();
    onChange(
      { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() },
      map.getZoom()
    );
  };

  const map = useMapEvents({
    moveend: () => report(map),
    zoomend: () => report(map),
  });

  // Report once on mount so the initial viewport loads.
  useEffect(() => {
    report(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function MapController({ focus }: { focus: Focus | null }) {
  const map = useMap();
  const lastNonce = useRef(-1);
  useEffect(() => {
    if (focus && focus.nonce !== lastNonce.current) {
      lastNonce.current = focus.nonce;
      map.flyTo([focus.lat, focus.lng], focus.zoom ?? Math.max(map.getZoom(), 14), {
        duration: 0.8,
      });
    }
  }, [focus, map]);
  return null;
}

function PlaceMarker({
  place,
  selected,
  onSelect,
}: {
  place: Place;
  selected: boolean;
  onSelect: (p: Place) => void;
}) {
  const { get } = useUserData();
  const entry = get(place.id);
  const status: MarkerStatus = entry?.visited
    ? "visited"
    : entry?.wantToVisit
    ? "saved"
    : "discover";

  const icon = useMemo(
    () => pinIcon(status, KIND_EMOJI[place.kind], selected),
    [status, place.kind, selected]
  );

  return (
    <Marker
      position={[place.lat, place.lng]}
      icon={icon}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(place) }}
    />
  );
}

export default function MapView({
  places,
  selectedId,
  onSelect,
  onBoundsChange,
  focus,
}: Props) {
  return (
    <MapContainer
      center={[50, 10]}
      zoom={5}
      minZoom={3}
      maxZoom={19}
      zoomControl={true}
      worldCopyJump
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <BoundsWatcher onChange={onBoundsChange} />
      <MapController focus={focus} />
      {places.map((p) => (
        <PlaceMarker
          key={p.id}
          place={p}
          selected={p.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </MapContainer>
  );
}

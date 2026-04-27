import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { Plus, Navigation, Layers } from "lucide-react";
import { api } from "../api/client";
import { Site } from "../types";
import SubmitModal from "../components/SubmitModal";

// Fix Leaflet icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeIcon = (color: string) =>
  L.divIcon({
    html: `<div style="width:16px;height:16px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const icons: Record<string, L.DivIcon> = {
  pending: makeIcon("#f97316"),
  approved: makeIcon("#22c55e"),
  verified: makeIcon("#22c55e"),
  duplicate: makeIcon("#ef4444"),
  declined: makeIcon("#6b7280"),
};

interface PinLocation { lat: number; lng: number; address?: string }

function MapClickHandler({ onPin }: { onPin: (loc: PinLocation) => void }) {
  useMapEvents({
    click(e) { onPin({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return null;
}

export default function MapPage() {
  const [pin, setPin] = useState<PinLocation | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data: sites = [], refetch } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/sites").then((r) => r.data),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserPos([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  const defaultCenter: [number, number] = userPos ?? [52.3702, 4.8952];

  const handleSuccess = (tokens: number, balance: number) => {
    refetch();
    setSuccessToast(`+${tokens} tokens earned! Balance: ${balance}`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPin={(loc) => { setPin(loc); setSubmitOpen(true); }} />

        {/* Known sites */}
        {sites.map((site) => (
          <Marker
            key={site.id}
            position={[site.latitude, site.longitude]}
            icon={icons[site.status] ?? icons.pending}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <div className="font-semibold">{site.projectName ?? "Unknown project"}</div>
                {site.projectType && <div className="text-slate-500 capitalize">{site.projectType}</div>}
                {site.participants?.length ? (
                  <div className="mt-1 text-xs text-slate-600">
                    {site.participants.slice(0, 3).map((p) => p.companyName).join(" · ")}
                  </div>
                ) : null}
                <div className={`mt-1 inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                  site.status === "approved" || site.status === "verified"
                    ? "bg-green-100 text-green-700"
                    : site.status === "duplicate"
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                }`}>
                  {site.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Current pin */}
        {pin && !submitOpen && (
          <Marker position={[pin.lat, pin.lng]} />
        )}

        {/* User location */}
        {userPos && (
          <Marker
            position={userPos}
            icon={L.divIcon({
              html: `<div style="width:12px;height:12px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
              className: "",
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur rounded-xl p-3 text-xs space-y-1.5 border border-slate-700">
        <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1"><Layers size={12} /> Sites</div>
        {[["#f97316","Pending"],["#22c55e","Verified"],["#ef4444","Duplicate"]].map(([color, label]) => (
          <div key={label} className="flex items-center gap-2">
            <div style={{ background: color }} className="w-3 h-3 rounded-full border-2 border-white shadow" />
            <span className="text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => {
          if (userPos) { setPin({ lat: userPos[0], lng: userPos[1] }); setSubmitOpen(true); }
          else alert("Tap the map to pin a location first, or enable location access.");
        }}
        className="absolute bottom-6 right-4 z-[1000] w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors active:scale-95"
        title="Submit new site"
      >
        <Plus size={28} />
      </button>

      {/* Location button */}
      <button
        onClick={() => navigator.geolocation?.getCurrentPosition((p) => setUserPos([p.coords.latitude, p.coords.longitude]))}
        className="absolute bottom-24 right-4 z-[1000] w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors border border-slate-600"
        title="My location"
      >
        <Navigation size={16} />
      </button>

      {/* Toast */}
      {successToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-bounce">
          {successToast}
        </div>
      )}

      {/* Submit modal */}
      {submitOpen && pin && (
        <SubmitModal
          lat={pin.lat}
          lng={pin.lng}
          address={pin.address}
          onClose={() => { setSubmitOpen(false); setPin(null); }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Hint */}
      <div className="absolute bottom-24 left-4 z-[1000] bg-slate-900/80 backdrop-blur rounded-xl px-3 py-2 text-xs text-slate-400 border border-slate-700 max-w-[180px]">
        Tap map to pin, or use <span className="text-orange-400 font-semibold">+</span> to submit your location
      </div>
    </div>
  );
}

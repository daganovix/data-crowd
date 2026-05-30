import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Leaf,
  List as ListIcon,
  Loader2,
  MapPin,
  MoreVertical,
  Navigation,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import MapView, { Focus } from "./components/MapView";
import Sidebar, { Tab } from "./components/Sidebar";
import PlaceDetail from "./components/PlaceDetail";
import { Bounds, fetchVeganPlaces } from "./lib/overpass";
import { geocode, GeocodeResult } from "./lib/geocode";
import { LatLng } from "./lib/distance";
import { Place } from "./types";
import { useUserData } from "./store/UserDataContext";

const MIN_FETCH_ZOOM = 10;

function CitySearch({ onPick }: { onPick: (r: GeocodeResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController>();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const r = await geocode(query.trim(), ctrl.signal);
        setResults(r);
        setOpen(true);
      } catch {
        /* ignore */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-leaf-200 bg-white px-3 py-2 focus-within:border-leaf-400 focus-within:ring-2 focus-within:ring-leaf-200">
        {loading ? (
          <Loader2 size={16} className="animate-spin text-leaf-400" />
        ) : (
          <Search size={16} className="text-leaf-400" />
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Search a city or place…"
          className="w-full bg-transparent text-sm text-leaf-900 placeholder:text-leaf-400 focus:outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} aria-label="Clear search">
            <X size={15} className="text-leaf-400 hover:text-leaf-600" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="vm-scroll absolute z-[1200] mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-leaf-100 bg-white py-1 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                onPick(r);
                setOpen(false);
                setQuery(r.label.split(",")[0]);
              }}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-leaf-50"
            >
              <MapPin size={15} className="mt-0.5 shrink-0 text-leaf-400" />
              <span className="text-leaf-700">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DataMenu() {
  const { exportJSON, importJSON, clearAll, data } = useUserData();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const count = Object.keys(data).length;

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vegan-map-data.json";
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const doImport = async (file: File) => {
    const text = await file.text();
    if (importJSON(text)) {
      alert("Data imported.");
    } else {
      alert("That file didn't look like valid Vegan Map data.");
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-2 text-leaf-600 hover:bg-leaf-100"
        aria-label="Data options"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[1200]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-[1300] mt-1 w-52 rounded-xl border border-leaf-100 bg-white py-1 shadow-lg">
            <button
              onClick={doExport}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-leaf-700 hover:bg-leaf-50"
            >
              <Download size={15} /> Export my data
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-leaf-700 hover:bg-leaf-50"
            >
              <Upload size={15} /> Import data
            </button>
            <button
              onClick={() => {
                if (count > 0 && confirm(`Delete all ${count} saved place(s)? This can't be undone.`)) {
                  clearAll();
                }
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={15} /> Clear all data
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  const { data } = useUserData();

  const [discoverPlaces, setDiscoverPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(5);

  const [tab, setTab] = useState<Tab>("discover");
  const [selected, setSelected] = useState<Place | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [veganOnly, setVeganOnly] = useState(false);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);

  const abortRef = useRef<AbortController>();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const focusNonce = useRef(0);

  const doFetch = useCallback((bounds: Bounds) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    fetchVeganPlaces(bounds, ctrl.signal)
      .then((p) => {
        if (!ctrl.signal.aborted) setDiscoverPlaces(p);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setError("Couldn't reach OpenStreetMap. Pan the map to retry.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
  }, []);

  const handleBoundsChange = useCallback(
    (bounds: Bounds, z: number) => {
      setZoom(z);
      clearTimeout(debounceRef.current);
      if (z < MIN_FETCH_ZOOM) {
        abortRef.current?.abort();
        setLoading(false);
        setDiscoverPlaces([]);
        return;
      }
      debounceRef.current = setTimeout(() => doFetch(bounds), 500);
    },
    [doFetch]
  );

  // Apply the "100% vegan only" filter to discovered places.
  const visibleDiscover = useMemo(
    () => (veganOnly ? discoverPlaces.filter((p) => p.vegan === "only") : discoverPlaces),
    [discoverPlaces, veganOnly]
  );

  // Markers: filtered discoveries plus every saved/visited place (always visible).
  const markerPlaces = useMemo(() => {
    const m = new Map<string, Place>();
    for (const e of Object.values(data)) {
      if (e.visited || e.wantToVisit) m.set(e.place.id, e.place);
    }
    for (const p of visibleDiscover) m.set(p.id, p);
    return [...m.values()];
  }, [visibleDiscover, data]);

  const flyTo = (lat: number, lng: number, z?: number) => {
    focusNonce.current += 1;
    setFocus({ lat, lng, zoom: z, nonce: focusNonce.current });
  };

  const locateMe = () => {
    if (!("geolocation" in navigator)) {
      alert("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        flyTo(loc.lat, loc.lng, 14);
        setTab("discover");
        setLocating(false);
      },
      () => {
        alert("Couldn't get your location. Check your browser's location permission.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const selectFromList = (place: Place) => {
    setSelected(place);
    setPanelOpen(true);
    flyTo(place.lat, place.lng);
  };

  const selectFromMap = (place: Place) => {
    setSelected(place);
    setPanelOpen(true);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Panel */}
      <aside
        className={
          (panelOpen ? "flex" : "hidden") +
          " absolute inset-0 z-[1100] w-full flex-col border-r border-leaf-100 bg-white md:relative md:z-auto md:flex md:w-[26rem]"
        }
      >
        {/* Header */}
        <header className="flex items-center gap-2 border-b border-leaf-100 px-4 py-3">
          <span className="text-2xl" aria-hidden>🌱</span>
          <div className="flex-1">
            <h1 className="text-base font-bold leading-tight text-leaf-800">Vegan Map</h1>
            <p className="text-xs text-leaf-500">Vegan eats across Europe</p>
          </div>
          <DataMenu />
          <button
            onClick={() => setPanelOpen(false)}
            className="rounded-lg p-2 text-leaf-600 hover:bg-leaf-100 md:hidden"
            aria-label="Show map"
          >
            <X size={18} />
          </button>
        </header>

        {/* Search */}
        <div className="border-b border-leaf-100 p-3">
          <CitySearch
            onPick={(r) => {
              flyTo(r.lat, r.lng, 13);
              setTab("discover");
            }}
          />
          {/* Filters */}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => setVeganOnly((v) => !v)}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition " +
                (veganOnly
                  ? "bg-leaf-600 text-white"
                  : "bg-leaf-100 text-leaf-700 hover:bg-leaf-200")
              }
              aria-pressed={veganOnly}
            >
              <Leaf size={13} className={veganOnly ? "fill-white" : ""} /> 100% vegan only
            </button>
            <button
              onClick={locateMe}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition " +
                (userLoc
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-leaf-100 text-leaf-700 hover:bg-leaf-200")
              }
            >
              {locating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Navigation size={13} className={userLoc ? "fill-white" : ""} />
              )}
              Near me
            </button>
          </div>
        </div>

        {/* List or detail */}
        <div className="flex-1 overflow-hidden">
          {selected ? (
            <PlaceDetail place={selected} onBack={() => setSelected(null)} />
          ) : (
            <Sidebar
              tab={tab}
              onTabChange={setTab}
              discoverPlaces={visibleDiscover}
              loading={loading}
              error={error}
              zoomedEnough={zoom >= MIN_FETCH_ZOOM}
              userLoc={userLoc}
              onSelect={selectFromList}
            />
          )}
        </div>
      </aside>

      {/* Map */}
      <main className="relative flex-1">
        <MapView
          places={markerPlaces}
          selectedId={selected?.id}
          onSelect={selectFromMap}
          onBoundsChange={handleBoundsChange}
          focus={focus}
          userLoc={userLoc}
        />

        {/* Loading chip on the map */}
        {loading && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-leaf-700 shadow">
            <Loader2 size={13} className="animate-spin" /> Loading vegan spots…
          </div>
        )}

        {/* Mobile: open the list */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute bottom-5 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-full bg-leaf-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg md:hidden"
          >
            <ListIcon size={16} /> Show list
          </button>
        )}
      </main>
    </div>
  );
}

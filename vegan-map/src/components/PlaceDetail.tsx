import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Check,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Utensils,
} from "lucide-react";
import { KIND_EMOJI, KIND_LABEL, Place } from "../types";
import { useUserData } from "../store/UserDataContext";
import StarRating from "./StarRating";

interface Props {
  place: Place;
  onBack: () => void;
}

export default function PlaceDetail({ place, onBack }: Props) {
  const { get, toggleVisited, toggleWantToVisit, setRating, setNotes } = useUserData();
  const entry = get(place.id);

  // Local notes buffer so typing stays smooth; flush to the store on blur.
  const [notes, setNotesLocal] = useState(entry?.notes ?? "");
  const lastId = useRef(place.id);
  useEffect(() => {
    if (lastId.current !== place.id) {
      lastId.current = place.id;
      setNotesLocal(get(place.id)?.notes ?? "");
    }
  }, [place.id, get]);

  const visited = entry?.visited ?? false;
  const wantToVisit = entry?.wantToVisit ?? false;
  const rating = entry?.rating ?? 0;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  const osmUrl = `https://www.openstreetmap.org/${place.osmType}/${place.osmId}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-leaf-100 px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-leaf-600 hover:bg-leaf-100"
          aria-label="Back to list"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-medium text-leaf-600">Back</span>
      </div>

      <div className="vm-scroll flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h2 className="text-xl font-bold leading-tight text-leaf-900">{place.name}</h2>
          <span className="text-2xl" aria-hidden>
            {KIND_EMOJI[place.kind]}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-leaf-100 px-2.5 py-0.5 text-xs font-medium text-leaf-700">
            {KIND_LABEL[place.kind]}
          </span>
          {place.vegan === "only" ? (
            <span className="rounded-full bg-leaf-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              100% vegan
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Vegan options
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="mb-5 grid grid-cols-2 gap-2">
          <button
            onClick={() => toggleVisited(place)}
            className={
              "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition " +
              (visited
                ? "bg-leaf-600 text-white hover:bg-leaf-700"
                : "bg-leaf-100 text-leaf-700 hover:bg-leaf-200")
            }
          >
            <Check size={16} />
            {visited ? "Visited" : "Mark visited"}
          </button>
          <button
            onClick={() => toggleWantToVisit(place)}
            className={
              "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition " +
              (wantToVisit
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100")
            }
          >
            <Bookmark size={16} className={wantToVisit ? "fill-white" : ""} />
            {wantToVisit ? "Saved" : "Want to visit"}
          </button>
        </div>

        {/* Rating */}
        <div className="mb-5 rounded-xl border border-leaf-100 bg-leaf-50/60 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-leaf-500">
            Your rating
          </div>
          <StarRating value={rating} onChange={(r) => setRating(place, r)} />
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-leaf-500">
            Your notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotesLocal(e.target.value)}
            onBlur={() => {
              if (notes !== (entry?.notes ?? "")) setNotes(place, notes);
            }}
            placeholder="What did you eat? How was it? Anything to remember for next time…"
            rows={4}
            className="w-full resize-y rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm text-leaf-900 placeholder:text-leaf-400 focus:border-leaf-400 focus:outline-none focus:ring-2 focus:ring-leaf-200"
          />
        </div>

        {/* Facts */}
        <div className="space-y-2.5 text-sm text-leaf-700">
          {place.cuisine && (
            <div className="flex items-start gap-2">
              <Utensils size={16} className="mt-0.5 shrink-0 text-leaf-400" />
              <span className="capitalize">{place.cuisine}</span>
            </div>
          )}
          {place.address && (
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-leaf-400" />
              <span>{place.address}</span>
            </div>
          )}
          {place.openingHours && (
            <div className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 shrink-0 text-leaf-400" />
              <span className="break-words">{place.openingHours}</span>
            </div>
          )}
          {place.phone && (
            <div className="flex items-start gap-2">
              <Phone size={16} className="mt-0.5 shrink-0 text-leaf-400" />
              <a href={`tel:${place.phone}`} className="hover:underline">
                {place.phone}
              </a>
            </div>
          )}
        </div>

        {/* External links */}
        <div className="mt-5 flex flex-wrap gap-2">
          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-leaf-200 px-3 py-1.5 text-xs font-medium text-leaf-700 hover:bg-leaf-100"
            >
              <ExternalLink size={14} /> Website
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-leaf-200 px-3 py-1.5 text-xs font-medium text-leaf-700 hover:bg-leaf-100"
          >
            <MapPin size={14} /> Directions
          </a>
          <a
            href={osmUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-leaf-200 px-3 py-1.5 text-xs font-medium text-leaf-700 hover:bg-leaf-100"
          >
            <ExternalLink size={14} /> OpenStreetMap
          </a>
        </div>
      </div>
    </div>
  );
}

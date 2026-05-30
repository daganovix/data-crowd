import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Place, UserData, UserPlaceData } from "../types";

const STORAGE_KEY = "vegan-map:userdata:v1";

function loadInitial(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function emptyEntry(place: Place): UserPlaceData {
  return {
    visited: false,
    rating: 0,
    notes: "",
    wantToVisit: false,
    updatedAt: Date.now(),
    place,
  };
}

/** Whether an entry still carries any meaningful user data. */
function isMeaningful(e: UserPlaceData): boolean {
  return e.visited || e.wantToVisit || e.rating > 0 || e.notes.trim().length > 0;
}

interface UserDataContextValue {
  data: UserData;
  get: (id: string) => UserPlaceData | undefined;
  /** Apply a partial update for a place, creating the entry if needed. */
  update: (place: Place, patch: Partial<UserPlaceData>) => void;
  toggleVisited: (place: Place) => void;
  toggleWantToVisit: (place: Place) => void;
  setRating: (place: Place, rating: number) => void;
  setNotes: (place: Place, notes: string) => void;
  /** Export all saved data as a JSON string. */
  exportJSON: () => string;
  /** Replace all saved data from a JSON string. Returns true on success. */
  importJSON: (json: string) => boolean;
  clearAll: () => void;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<UserData>(loadInitial);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or blocked — ignore */
    }
  }, [data]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback(
    (place: Place, patch: Partial<UserPlaceData>) => {
      setData((prev) => {
        const existing = prev[place.id] ?? emptyEntry(place);
        const next: UserPlaceData = {
          ...existing,
          ...patch,
          // Always refresh the cached place snapshot with the latest data.
          place: { ...existing.place, ...place },
          updatedAt: Date.now(),
        };
        // Drop the entry entirely if it no longer holds anything useful.
        if (!isMeaningful(next)) {
          const { [place.id]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [place.id]: next };
      });
    },
    []
  );

  const get = useCallback((id: string) => dataRef.current[id], []);

  const toggleVisited = useCallback(
    (place: Place) => {
      const cur = dataRef.current[place.id];
      const nowVisited = !cur?.visited;
      // Marking visited clears the want-to-visit flag (you've been now).
      update(place, {
        visited: nowVisited,
        wantToVisit: nowVisited ? false : cur?.wantToVisit ?? false,
      });
    },
    [update]
  );

  const toggleWantToVisit = useCallback(
    (place: Place) => {
      const cur = dataRef.current[place.id];
      update(place, { wantToVisit: !cur?.wantToVisit });
    },
    [update]
  );

  const setRating = useCallback(
    (place: Place, rating: number) => {
      const cur = dataRef.current[place.id];
      // Rating something implies you've visited it.
      update(place, { rating, visited: cur?.visited || rating > 0 });
    },
    [update]
  );

  const setNotes = useCallback(
    (place: Place, notes: string) => update(place, { notes }),
    [update]
  );

  const exportJSON = useCallback(() => JSON.stringify(dataRef.current, null, 2), []);

  const importJSON = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== "object" || parsed === null) return false;
      setData(parsed);
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearAll = useCallback(() => setData({}), []);

  const value = useMemo<UserDataContextValue>(
    () => ({
      data,
      get,
      update,
      toggleVisited,
      toggleWantToVisit,
      setRating,
      setNotes,
      exportJSON,
      importJSON,
      clearAll,
    }),
    [data, get, update, toggleVisited, toggleWantToVisit, setRating, setNotes, exportJSON, importJSON, clearAll]
  );

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData(): UserDataContextValue {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error("useUserData must be used within a UserDataProvider");
  return ctx;
}

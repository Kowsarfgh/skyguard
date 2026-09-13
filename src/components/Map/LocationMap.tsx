import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import { Search, Navigation, MapPin } from "lucide-react";
import type { Coordinates } from "../../types";
import { geocodeSearch } from "../../services/api";
import { DEMO_LOCATION } from "../../services/api/mockData";

const pinIcon = L.divIcon({
  className: "custom-pin",
  html: `<div style="transform: translate(-50%, -100%)">
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3" fill="#818CF8" stroke="#6366F1"/>
    </svg>
  </div>`,
  iconSize: [40, 48],
  iconAnchor: [20, 48]
});

function ClickHandler({
  onPick
}: {
  onPick: (coords: Coordinates) => void;
}) {
  useMapEvents({
    click(e) {
      onPick({
        latitude: Number(e.latlng.lat.toFixed(4)),
        longitude: Number(e.latlng.lng.toFixed(4))
      });
    }
  });
  return null;
}

function FlyTo({ location }: { location: Coordinates }) {
  const map = useMap();
  const prev = useRef(`${location.latitude},${location.longitude}`);
  useEffect(() => {
    const key = `${location.latitude},${location.longitude}`;
    if (prev.current !== key) {
      prev.current = key;
      map.flyTo([location.latitude, location.longitude], Math.max(map.getZoom(), 7), {
        duration: 0.8
      });
    }
  }, [location, map]);
  return null;
}

export interface LocationMapProps {
  location: Coordinates;
  onChange: (c: Coordinates) => void;
  height?: string;
  demoMode?: boolean;
}

export function LocationMap({
  location,
  onChange,
  height = "460px",
  demoMode
}: LocationMapProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ lat: number; lon: number; label: string }>
  >([]);
  const [showSug, setShowSug] = useState(false);

  const position = useMemo(
    () => [location.latitude, location.longitude] as [number, number],
    [location.latitude, location.longitude]
  );

  const onSearch = async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await geocodeSearch(q);
      setSuggestions(
        res.map((r) => ({
          lat: Number(r.lat),
          lon: Number(r.lon),
          label: r.display_name
        }))
      );
      setShowSug(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const selectSuggestion = (s: { lat: number; lon: number; label: string }) => {
    onChange({
      latitude: Number(s.lat.toFixed(4)),
      longitude: Number(s.lon.toFixed(4)),
      placeName: s.label.split(",").slice(0, 3).join(",").trim()
    });
    setShowSug(false);
    setQuery("");
  };

  return (
    <div className="glass-card overflow-hidden relative">
      <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2 pointer-events-none">
        <div className="relative flex-1 pointer-events-auto">
          <div className="flex items-center bg-space-900/70 backdrop-blur rounded-xl border border-white/10 px-3 py-2 shadow-lg">
            <Search className="w-4 h-4 text-nebula-400 mr-2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch(query)}
              placeholder="Search city or place..."
              className="bg-transparent outline-none text-sm flex-1 text-white placeholder:text-gray-400"
            />
            {searching && (
              <div className="w-4 h-4 rounded-full border-2 border-nebula-500/30 border-t-nebula-500 animate-spin" />
            )}
            <button
              onClick={() => onSearch(query)}
              disabled={searching}
              className="ml-2 px-2 py-1 rounded-md bg-nebula-500/20 text-nebula-300 text-xs hover:bg-nebula-500/30 transition"
            >
              Go
            </button>
          </div>
          {showSug && suggestions.length > 0 && (
            <div className="mt-2 max-h-60 overflow-auto rounded-xl border border-white/10 bg-space-900/95 backdrop-blur shadow-2xl">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-white/5 last:border-0 text-gray-200 flex items-start gap-2"
                >
                  <MapPin className="w-4 h-4 text-nebula-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none">
        <div className="bg-space-900/70 backdrop-blur rounded-xl border border-white/10 px-3 py-2 text-xs font-mono text-gray-200 shadow-lg flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-nebula-400" />
          <span>Lat {location.latitude.toFixed(4)}</span>
          <span className="text-white/20">|</span>
          <span>Lon {location.longitude.toFixed(4)}</span>
          {demoMode && (
            <>
              <span className="text-white/20">|</span>
              <span className="text-starlight-400 font-bold">DEMO</span>
            </>
          )}
        </div>
      </div>

      <MapContainer
        center={position}
        zoom={7}
        scrollWheelZoom
        style={{ height, width: "100%" }}
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <ClickHandler
          onPick={(c) => onChange({ ...c, placeName: undefined })}
        />
        <FlyTo location={location} />
        <Marker position={position} icon={pinIcon}>
          <Popup className="text-gray-900 text-sm">
            <div className="font-semibold">
              {location.placeName ?? "Selected location"}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

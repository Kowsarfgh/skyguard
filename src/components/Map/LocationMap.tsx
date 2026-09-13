import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  LayersControl
} from "react-leaflet";
import L from "leaflet";
import { Search, Navigation, MapPin, AlertTriangle, Layers } from "lucide-react";
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

const TILE_LAYERS = [
  {
    name: "CartoDB Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO"
  },
  {
    name: "OSM Dark (Carto)",
    url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap"
  },
  {
    name: "OpenStreetMap Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  },
  {
    name: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap (CC-BY-SA)",
    maxZoom: 17
  },
  {
    name: "Esri World Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19
  }
];

function ClickHandler({ onPick }: { onPick: (coords: Coordinates) => void }) {
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

function TileErrorHandler({
  onFail
}: {
  onFail: (layerName: string) => void;
}) {
  const map = useMap();
  const reportedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const tryLayers = [...TILE_LAYERS];
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        const url = (layer as any)._url ?? "";
        const layerName =
          tryLayers.find((t) => t.url === url)?.name ?? "tiles";
        layer.on("tileerror", () => {
          if (!reportedRef.current.has(layerName)) {
            reportedRef.current.add(layerName);
            onFail(layerName);
          }
        });
      }
    });
  }, [map, onFail]);
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
  const [failedLayers, setFailedLayers] = useState<Set<string>>(new Set());
  const [mapError, setMapError] = useState<string | null>(null);
  const failedCount = failedLayers.size;

  const position = useMemo(
    () => [location.latitude, location.longitude] as [number, number],
    [location.latitude, location.longitude]
  );

  const primary = TILE_LAYERS[0];
  const backup = TILE_LAYERS[2]; // OSM standard guaranteed no key

  const onSearch = async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    setMapError(null);
    try {
      const res = await geocodeSearch(q);
      if (res.length === 0) {
        setSuggestions([]);
        setMapError(`No places found for "${q}". Try clicking the map directly.`);
      } else {
        setSuggestions(
          res.map((r) => ({
            lat: Number(r.lat),
            lon: Number(r.lon),
            label: r.display_name
          }))
        );
        setShowSug(true);
      }
    } catch (e) {
      setSuggestions([]);
      setMapError(
        "Place search service is currently unavailable. Click anywhere on the map to pick a location."
      );
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

  const onTileFail = (name: string) => {
    setFailedLayers((prev) => {
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  return (
    <div className="glass-card overflow-hidden relative">
      <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2 pointer-events-none flex-col sm:flex-row">
        <div className="relative flex-1 pointer-events-auto">
          <div className="flex items-center bg-space-900/70 backdrop-blur rounded-xl border border-white/10 px-3 py-2 shadow-lg">
            <Search className="w-4 h-4 text-nebula-400 mr-2 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch(query)}
              placeholder="Search city or place... (or click map)"
              className="bg-transparent outline-none text-sm flex-1 text-white placeholder:text-gray-400 min-w-0"
            />
            {searching && (
              <div className="w-4 h-4 rounded-full border-2 border-nebula-500/30 border-t-nebula-500 animate-spin shrink-0" />
            )}
            <button
              onClick={() => onSearch(query)}
              disabled={searching}
              className="ml-2 px-2 py-1 rounded-md bg-nebula-500/20 text-nebula-300 text-xs hover:bg-nebula-500/30 transition shrink-0"
            >
              Go
            </button>
          </div>
          {showSug && suggestions.length > 0 && (
            <div className="mt-2 max-h-60 overflow-auto rounded-xl border border-white/10 bg-space-900/95 backdrop-blur shadow-2xl z-[1001]">
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

      <div className="absolute top-3 right-3 z-[1000] pointer-events-auto hidden sm:block">
        <div className="bg-space-900/70 backdrop-blur rounded-xl border border-white/10 px-3 py-2 shadow-lg flex items-center gap-2 text-xs text-gray-300">
          <Layers className="w-3.5 h-3.5 text-nebula-400" />
          <span className="font-semibold">{failedCount > 0 ? backup.name : primary.name}</span>
          {failedCount > 0 && (
            <span className="text-starlight-400 font-bold">fallback</span>
          )}
        </div>
      </div>

      {(mapError || failedCount > 1) && (
        <div className="absolute top-20 left-3 right-3 z-[1000] pointer-events-auto">
          <div className="flex items-start gap-2 bg-starlight-500/10 border border-starlight-500/30 text-starlight-300 rounded-xl px-3 py-2 text-xs backdrop-blur">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              {mapError ||
                `Some map tile sources failed (${failedCount} of ${TILE_LAYERS.length}). Automatically using backup tile layer. Click map to pick location.`}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none">
        <div className="bg-space-900/70 backdrop-blur rounded-xl border border-white/10 px-3 py-2 text-xs font-mono text-gray-200 shadow-lg flex items-center gap-2 flex-wrap">
          <Navigation className="w-3.5 h-3.5 text-nebula-400 shrink-0" />
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
        style={{ height, width: "100%", background: "#0B0D1E" }}
        worldCopyJump
        preferCanvas
      >
        {failedCount === 0 ? (
          <TileLayer
            key={primary.name}
            attribution={primary.attribution}
            url={primary.url}
            maxZoom={primary.maxZoom ?? 19}
          />
        ) : (
          <>
            <TileLayer
              key={backup.name}
              attribution={backup.attribution}
              url={backup.url}
              maxZoom={backup.maxZoom ?? 19}
            />
            <TileErrorHandler onFail={onTileFail} />
          </>
        )}
        <TileErrorHandler onFail={onTileFail} />
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

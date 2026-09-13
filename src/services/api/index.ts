import type { AnalysisInput, WeatherData } from "../../types";
import { fetchOpenMeteo } from "./openMeteo";
import { fetchNasaPower } from "./nasaPower";
import { DEMO_LOCATION, generateDemoWeather } from "./mockData";

export const getEffectiveLocation = (input: AnalysisInput) =>
  input.isDemo ? DEMO_LOCATION : input.location;

export const fetchWeatherData = async (input: AnalysisInput): Promise<WeatherData> => {
  if (input.isDemo) {
    return generateDemoWeather(input.date);
  }
  const openMeteo = await fetchOpenMeteo(input.location, input.date);
  const nasa = await fetchNasaPower(input.location, input.date);

  if (nasa.uvIndex != null && nasa.uvIndex > 0) {
    openMeteo.hours.forEach((h) => {
      if (h.hour >= 7 && h.hour <= 18) {
        const scale =
          h.uvIndex > 0 ? Math.max(0.6, 1 - Math.abs(h.hour - 13) / 8) : 1;
        h.uvIndex = Math.max(h.uvIndex, Number((nasa.uvIndex as number) * scale).toFixed(1) as unknown as number);
      }
    });
  }

  return openMeteo;
};

export interface GeocodeResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export const geocodeSearch = async (query: string): Promise<GeocodeResult[]> => {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "5"
  }).toString()}`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en" }
  });
  if (!res.ok) throw new Error("Search service unavailable");
  return (await res.json()) as GeocodeResult[];
};

export const reverseGeocode = async (
  lat: number,
  lon: number
): Promise<string | null> => {
  const url = `https://nominatim.openstreetmap.org/reverse?${new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: "json",
    zoom: "10"
  }).toString()}`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
};

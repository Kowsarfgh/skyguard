import type { Coordinates, WeatherConditions, WeatherData } from "../../types";

const WEATHER_CODES = {
  CLEAR: 0,
  CLOUDY_PARTLY: 1,
  CLOUDY: 2,
  OVERCAST: 3,
  FOG: 45,
  DRIZZLE: 51,
  RAIN_LIGHT: 61,
  RAIN_MODERATE: 63,
  RAIN_HEAVY: 65,
  THUNDERSTORM: 95
};

export interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  relative_humidity_2m: number[];
  visibility: number[];
  weather_code: number[];
  uv_index?: number[];
  cloud_cover?: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  hourly: OpenMeteoHourly;
  error?: boolean;
  reason?: string;
}

const parseHour = (iso: string): number => {
  const d = new Date(iso);
  return d.getHours();
};

export const transformOpenMeteo = (
  raw: OpenMeteoResponse,
  location: Coordinates,
  date: string
): WeatherData => {
  const h = raw.hourly;
  const len = h.time.length;
  const hours: WeatherConditions[] = [];
  for (let i = 0; i < len; i++) {
    const iso = h.time[i];
    if (!iso.startsWith(date)) continue;
    const uv = h.uv_index?.[i] ?? 0;
    const visKm = (h.visibility?.[i] ?? 10000) / 1000;
    hours.push({
      timestamp: iso,
      hour: parseHour(iso),
      temperatureC: h.temperature_2m[i] ?? 20,
      feelsLikeC: h.apparent_temperature[i] ?? h.temperature_2m[i] ?? 20,
      precipitationProbability: h.precipitation_probability[i] ?? 0,
      precipitationAmountMm: h.precipitation[i] ?? 0,
      windSpeedKmh: h.wind_speed_10m[i] ?? 0,
      windGustKmh: h.wind_gusts_10m[i] ?? h.wind_speed_10m[i] ?? 0,
      relativeHumidity: h.relative_humidity_2m[i] ?? 50,
      visibilityKm: isFinite(visKm) ? visKm : 10,
      weatherCode: h.weather_code[i] ?? 0,
      uvIndex: isFinite(uv) ? uv : 0,
      cloudCover: h.cloud_cover?.[i] ?? 0
    });
  }
  if (!hours.length) {
    throw new Error(
      `No hourly weather data returned for date ${date}. Try a date within the next 7 days.`
    );
  }
  return {
    location: { latitude: raw.latitude, longitude: raw.longitude, placeName: location.placeName },
    date,
    hours
  };
};

const buildUrl = (lat: number, lon: number, startDate: string, endDate: string): string => {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly:
      "temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,visibility,weather_code,uv_index,cloud_cover",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timezone: "auto",
    start_date: startDate,
    end_date: endDate
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
};

export const fetchOpenMeteo = async (
  location: Coordinates,
  date: string
): Promise<WeatherData> => {
  const url = buildUrl(location.latitude, location.longitude, date, date);
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`Weather API HTTP ${res.status}: Unable to fetch forecast`);
    }
    const data = (await res.json()) as OpenMeteoResponse;
    if (data.error) throw new Error(data.reason ?? "Open-Meteo API error");
    return transformOpenMeteo(data, location, date);
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error).name === "AbortError") {
      throw new Error("Weather request timed out. Please try again.");
    }
    throw err;
  }
};

export { WEATHER_CODES };

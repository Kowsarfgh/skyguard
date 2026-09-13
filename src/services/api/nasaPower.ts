import type { Coordinates } from "../../types";

export interface NasaPowerParameters {
  ALLSKY_SFC_UV_INDEX?: number[];
  T2M?: number[];
  WS2M?: number[];
  PRECTOTCORR?: number[];
  RH2M?: number[];
}

export interface NasaPowerResponse {
  properties: {
    parameter: NasaPowerParameters;
  };
  messages?: string[];
  type?: string;
}

export const buildNasaPowerUrl = (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): string => {
  const params = new URLSearchParams({
    parameters: "ALLSKY_SFC_UV_INDEX,T2M,WS2M,PRECTOTCORR,RH2M",
    community: "RE",
    longitude: lon.toFixed(4),
    latitude: lat.toFixed(4),
    start: startDate.replace(/-/g, ""),
    end: endDate.replace(/-/g, ""),
    format: "JSON"
  });
  return `https://power.larc.nasa.gov/api/temporal/daily/point?${params.toString()}`;
};

export const fetchNasaPower = async (
  location: Coordinates,
  date: string
): Promise<Partial<{ uvIndex: number; tempC: number; windKmh: number; precipMm: number; rh: number }>> => {
  const url = buildNasaPowerUrl(location.latitude, location.longitude, date, date);
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timeout);
    if (!res.ok) return {};
    const data = (await res.json()) as NasaPowerResponse;
    const p = data.properties?.parameter ?? {};
    const get = (arr?: number[]) => (arr && arr.length ? arr[0] : undefined);
    return {
      uvIndex: get(p.ALLSKY_SFC_UV_INDEX),
      tempC: get(p.T2M),
      windKmh: get(p.WS2M) != null ? (get(p.WS2M) as number) * 3.6 : undefined,
      precipMm: get(p.PRECTOTCORR),
      rh: get(p.RH2M)
    };
  } catch {
    clearTimeout(timeout);
    return {};
  }
};

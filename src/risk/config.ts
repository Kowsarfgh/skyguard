import type { ActivityType, RiskLevel } from "../types";

export interface ActivityThresholds {
  windSpeedKmh: { LOW: number; MEDIUM: number };
  precipitationProbability: { LOW: number; MEDIUM: number };
  temperatureC: { minComfort: number; maxComfort: number; extremeCold: number; extremeHeat: number };
  visibilityKm: { LOW: number; MEDIUM: number };
  uvIndex: { LOW: number; MEDIUM: number };
  weightMultipliers: { rain: number; wind: number; temperature: number; visibility: number; uv: number };
}

export const RISK_SCORES = {
  LOW: { min: 0, max: 33 },
  MEDIUM: { min: 34, max: 66 },
  HIGH: { min: 67, max: 100 }
} as const;

export const scoreToRisk = (score: number): RiskLevel => {
  if (score <= RISK_SCORES.LOW.max) return "LOW";
  if (score <= RISK_SCORES.MEDIUM.max) return "MEDIUM";
  return "HIGH";
};

const DEFAULT_WEIGHTS = {
  rain: 1.0,
  wind: 1.0,
  temperature: 1.0,
  visibility: 1.0,
  uv: 1.0
};

export const ACTIVITY_THRESHOLDS: Record<ActivityType, ActivityThresholds> = {
  hiking: {
    windSpeedKmh: { LOW: 20, MEDIUM: 35 },
    precipitationProbability: { LOW: 20, MEDIUM: 50 },
    temperatureC: { minComfort: 5, maxComfort: 25, extremeCold: -5, extremeHeat: 32 },
    visibilityKm: { LOW: 8, MEDIUM: 3 },
    uvIndex: { LOW: 5, MEDIUM: 8 },
    weightMultipliers: { ...DEFAULT_WEIGHTS, wind: 1.3, temperature: 1.2, visibility: 1.2 }
  },
  camping: {
    windSpeedKmh: { LOW: 25, MEDIUM: 40 },
    precipitationProbability: { LOW: 25, MEDIUM: 55 },
    temperatureC: { minComfort: 0, maxComfort: 28, extremeCold: -10, extremeHeat: 35 },
    visibilityKm: { LOW: 5, MEDIUM: 2 },
    uvIndex: { LOW: 6, MEDIUM: 9 },
    weightMultipliers: { ...DEFAULT_WEIGHTS, rain: 1.3 }
  },
  fishing: {
    windSpeedKmh: { LOW: 15, MEDIUM: 28 },
    precipitationProbability: { LOW: 30, MEDIUM: 60 },
    temperatureC: { minComfort: 8, maxComfort: 28, extremeCold: 0, extremeHeat: 35 },
    visibilityKm: { LOW: 10, MEDIUM: 5 },
    uvIndex: { LOW: 5, MEDIUM: 8 },
    weightMultipliers: { ...DEFAULT_WEIGHTS, wind: 1.4, visibility: 1.3 }
  },
  cycling: {
    windSpeedKmh: { LOW: 18, MEDIUM: 32 },
    precipitationProbability: { LOW: 15, MEDIUM: 40 },
    temperatureC: { minComfort: 5, maxComfort: 28, extremeCold: -2, extremeHeat: 33 },
    visibilityKm: { LOW: 8, MEDIUM: 4 },
    uvIndex: { LOW: 5, MEDIUM: 8 },
    weightMultipliers: { ...DEFAULT_WEIGHTS, wind: 1.5, rain: 1.3 }
  },
  beach: {
    windSpeedKmh: { LOW: 22, MEDIUM: 38 },
    precipitationProbability: { LOW: 10, MEDIUM: 30 },
    temperatureC: { minComfort: 18, maxComfort: 32, extremeCold: 10, extremeHeat: 38 },
    visibilityKm: { LOW: 10, MEDIUM: 5 },
    uvIndex: { LOW: 4, MEDIUM: 7 },
    weightMultipliers: { ...DEFAULT_WEIGHTS, uv: 1.5, rain: 1.4 }
  },
  photography: {
    windSpeedKmh: { LOW: 25, MEDIUM: 45 },
    precipitationProbability: { LOW: 20, MEDIUM: 45 },
    temperatureC: { minComfort: 0, maxComfort: 30, extremeCold: -10, extremeHeat: 36 },
    visibilityKm: { LOW: 15, MEDIUM: 8 },
    uvIndex: { LOW: 6, MEDIUM: 9 },
    weightMultipliers: { ...DEFAULT_WEIGHTS, visibility: 1.8 }
  },
  traveling: {
    windSpeedKmh: { LOW: 30, MEDIUM: 50 },
    precipitationProbability: { LOW: 30, MEDIUM: 60 },
    temperatureC: { minComfort: 0, maxComfort: 32, extremeCold: -10, extremeHeat: 38 },
    visibilityKm: { LOW: 6, MEDIUM: 3 },
    uvIndex: { LOW: 6, MEDIUM: 9 },
    weightMultipliers: { ...DEFAULT_WEIGHTS }
  },
  other: {
    windSpeedKmh: { LOW: 25, MEDIUM: 40 },
    precipitationProbability: { LOW: 25, MEDIUM: 50 },
    temperatureC: { minComfort: 5, maxComfort: 30, extremeCold: -5, extremeHeat: 35 },
    visibilityKm: { LOW: 8, MEDIUM: 4 },
    uvIndex: { LOW: 6, MEDIUM: 9 },
    weightMultipliers: { ...DEFAULT_WEIGHTS }
  }
};

export const ANALYSIS_HOURS = [6, 9, 12, 15, 18, 21] as const;
export const SAFE_WINDOW_DURATION_HOURS = 3;

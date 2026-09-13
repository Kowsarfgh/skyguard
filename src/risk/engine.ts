import type {
  ActivityType,
  HourlyRisk,
  RecommendedWindow,
  RiskFactor,
  RiskLevel,
  RiskResult,
  WeatherConditions,
  WeatherData
} from "../types";
import {
  ACTIVITY_THRESHOLDS,
  ANALYSIS_HOURS,
  RISK_SCORES,
  SAFE_WINDOW_DURATION_HOURS,
  scoreToRisk
} from "./config";

const clamp = (value: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, value));

const linearRiskScore = (
  value: number,
  lowThreshold: number,
  mediumThreshold: number,
  invert = false
): number => {
  const v = invert ? -value : value;
  const low = invert ? -lowThreshold : lowThreshold;
  const med = invert ? -mediumThreshold : mediumThreshold;
  if (v <= low) return clamp((v / Math.max(low, 0.001)) * 10);
  if (v <= med) return clamp(34 + ((v - low) / (med - low)) * 32);
  return clamp(67 + Math.min((v - med) / Math.max(med, 1), 1) * 33);
};

export const computeTemperatureRisk = (
  tempC: number,
  activity: ActivityType
): { heat: RiskFactor; cold: RiskFactor; dominant: RiskFactor & { subType: "heat" | "cold" } } => {
  const cfg = ACTIVITY_THRESHOLDS[activity].temperatureC;

  let heatScore = 0;
  if (tempC > cfg.maxComfort) {
    const overComfort = tempC - cfg.maxComfort;
    const overExtreme = Math.max(tempC - cfg.extremeHeat, 0);
    heatScore = clamp((overComfort / Math.max(cfg.extremeHeat - cfg.maxComfort, 1)) * 67 + overExtreme * 3);
  }
  const heat: RiskFactor = {
    value: tempC,
    risk: scoreToRisk(heatScore),
    score: heatScore,
    label: "Heat",
    description:
      heatScore > 66
        ? `Extreme heat (${tempC}°C) - heat exhaustion risk`
        : heatScore > 33
        ? `Warm (${tempC}°C) - stay hydrated`
        : `Temperature is comfortable`
  };

  let coldScore = 0;
  if (tempC < cfg.minComfort) {
    const underComfort = cfg.minComfort - tempC;
    const underExtreme = Math.max(cfg.extremeCold - tempC, 0);
    coldScore = clamp((underComfort / Math.max(cfg.minComfort - cfg.extremeCold, 1)) * 67 + underExtreme * 3);
  }
  const cold: RiskFactor = {
    value: tempC,
    risk: scoreToRisk(coldScore),
    score: coldScore,
    label: "Cold",
    description:
      coldScore > 66
        ? `Freezing (${tempC}°C) - hypothermia risk`
        : coldScore > 33
        ? `Chilly (${tempC}°C) - dress in layers`
        : `Temperature is comfortable`
  };

  const dominant =
    heat.score >= cold.score
      ? { ...heat, subType: "heat" as const }
      : { ...cold, subType: "cold" as const };
  return { heat, cold, dominant };
};

export const computeRainRisk = (
  probability: number,
  amountMm: number,
  activity: ActivityType
): RiskFactor => {
  const cfg = ACTIVITY_THRESHOLDS[activity].precipitationProbability;
  const probScore = linearRiskScore(probability, cfg.LOW, cfg.MEDIUM);
  const amountScore = clamp(amountMm * 8, 0, 100);
  const combined = clamp(probScore * 0.6 + amountScore * 0.4);
  return {
    value: probability,
    risk: scoreToRisk(combined),
    score: combined,
    label: "Rain",
    description:
      combined > 66
        ? `High rain risk (${probability}% chance, ${amountMm.toFixed(1)}mm expected)`
        : combined > 33
        ? `Rain possible (${probability}% chance)`
        : probability > 0
        ? `Low rain chance (${probability}%)`
        : `Dry conditions`
  };
};

export const computeWindRisk = (
  speedKmh: number,
  gustKmh: number,
  activity: ActivityType
): RiskFactor => {
  const cfg = ACTIVITY_THRESHOLDS[activity].windSpeedKmh;
  const speedScore = linearRiskScore(speedKmh, cfg.LOW, cfg.MEDIUM);
  const gustScore = linearRiskScore(gustKmh, cfg.LOW * 1.3, cfg.MEDIUM * 1.3);
  const combined = clamp(speedScore * 0.6 + gustScore * 0.4);
  return {
    value: speedKmh,
    risk: scoreToRisk(combined),
    score: combined,
    label: "Wind",
    description:
      combined > 66
        ? `Strong winds (${speedKmh.toFixed(0)} km/h, gusts ${gustKmh.toFixed(0)} km/h)`
        : combined > 33
        ? `Breezy (${speedKmh.toFixed(0)} km/h)`
        : `Calm winds`
  };
};

export const computeVisibilityRisk = (
  visibilityKm: number,
  activity: ActivityType
): RiskFactor => {
  const cfg = ACTIVITY_THRESHOLDS[activity].visibilityKm;
  const score = linearRiskScore(visibilityKm, cfg.LOW, cfg.MEDIUM, true);
  return {
    value: visibilityKm,
    risk: scoreToRisk(score),
    score,
    label: "Visibility",
    description:
      score > 66
        ? `Poor visibility (${visibilityKm.toFixed(1)} km)`
        : score > 33
        ? `Reduced visibility (${visibilityKm.toFixed(1)} km)`
        : `Clear visibility (${visibilityKm.toFixed(1)} km)`
  };
};

export const computeUvRisk = (uvIndex: number, activity: ActivityType): RiskFactor => {
  const cfg = ACTIVITY_THRESHOLDS[activity].uvIndex;
  const score = linearRiskScore(uvIndex, cfg.LOW, cfg.MEDIUM);
  return {
    value: uvIndex,
    risk: scoreToRisk(score),
    score,
    label: "UV Index",
    description:
      score > 66
        ? `Extreme UV (${uvIndex.toFixed(1)}) - sunburn in minutes`
        : score > 33
        ? `High UV (${uvIndex.toFixed(1)}) - wear protection`
        : `Low-moderate UV exposure`
  };
};

const pickHour = (hours: WeatherConditions[], targetHour: number): WeatherConditions => {
  if (!hours.length) throw new Error("Empty weather data");
  let best = hours[0];
  let bestDiff = Math.abs(best.hour - targetHour);
  for (const h of hours) {
    const d = Math.abs(h.hour - targetHour);
    if (d < bestDiff) {
      bestDiff = d;
      best = h;
    }
  }
  return best;
};

const formatHour = (h: number): string => `${h.toString().padStart(2, "0")}:00`;

export const computeHourlyRisk = (
  weather: WeatherData,
  activity: ActivityType
): HourlyRisk[] => {
  const weights = ACTIVITY_THRESHOLDS[activity].weightMultipliers;
  return ANALYSIS_HOURS.map((h) => {
    const conditions = pickHour(weather.hours, h);
    const { heat, cold } = computeTemperatureRisk(conditions.temperatureC, activity);
    const rain = computeRainRisk(
      conditions.precipitationProbability,
      conditions.precipitationAmountMm,
      activity
    );
    const wind = computeWindRisk(conditions.windSpeedKmh, conditions.windGustKmh, activity);
    const visibility = computeVisibilityRisk(conditions.visibilityKm, activity);
    const uv = computeUvRisk(conditions.uvIndex, activity);

    const tempDominant = heat.score >= cold.score ? heat : cold;
    const weighted =
      tempDominant.score * weights.temperature +
      rain.score * weights.rain +
      wind.score * weights.wind +
      visibility.score * weights.visibility +
      uv.score * weights.uv;
    const totalWeight =
      weights.temperature + weights.rain + weights.wind + weights.visibility + weights.uv;
    const overallScore = clamp(weighted / totalWeight);

    return {
      hour: h,
      time: formatHour(h),
      overallScore: Math.round(overallScore),
      overallRisk: scoreToRisk(overallScore),
      factors: { heat, cold, rain, wind, visibility, uv }
    };
  });
};

export const findRecommendedWindows = (hourly: HourlyRisk[]): RecommendedWindow[] => {
  const sortedHours = [...hourly].sort((a, b) => a.hour - b.hour);
  const windowScores: Array<{
    startHour: number;
    endHour: number;
    total: number;
    count: number;
    maxScore: number;
  }> = [];

  for (const start of sortedHours) {
    const endHourLimit = start.hour + SAFE_WINDOW_DURATION_HOURS;
    const inside = sortedHours.filter((h) => h.hour >= start.hour && h.hour <= endHourLimit);
    if (!inside.length) continue;
    const total = inside.reduce((s, h) => s + h.overallScore, 0);
    const maxScore = inside.reduce((m, h) => Math.max(m, h.overallScore), 0);
    windowScores.push({
      startHour: start.hour,
      endHour: Math.min(inside[inside.length - 1].hour, endHourLimit),
      total,
      count: inside.length,
      maxScore
    });
  }

  const normalized = windowScores
    .map((w) => {
      const avgScore = w.total / w.count;
      return {
        ...w,
        avgScore,
        combinedScore: avgScore * 0.7 + w.maxScore * 0.3
      };
    })
    .sort((a, b) => a.combinedScore - b.combinedScore);

  const unique = normalized.reduce<typeof normalized>((acc, cur) => {
    const overlap = acc.find(
      (a) =>
        Math.abs(a.startHour - cur.startHour) < SAFE_WINDOW_DURATION_HOURS ||
        Math.abs(a.endHour - cur.endHour) < SAFE_WINDOW_DURATION_HOURS
    );
    if (!overlap) acc.push(cur);
    return acc;
  }, []);

  return unique.slice(0, 3).map((w) => ({
    startHour: w.startHour,
    endHour: w.endHour + 1,
    startTime: formatHour(w.startHour),
    endTime: formatHour(Math.min(24, w.endHour + 1)),
    averageScore: Math.round(w.avgScore),
    risk: scoreToRisk(w.avgScore)
  }));
};

export const summarizeOverallRisk = (
  hourly: HourlyRisk[],
  activity: ActivityType
): Omit<RiskResult, "hourly" | "recommendedWindows" | "safestWindow" | "activity" | "dataTimestamp"> => {
  const avg = hourly.reduce((s, h) => s + h.overallScore, 0) / hourly.length;
  const peak = hourly.reduce((m, h) => Math.max(m, h.overallScore), 0);
  const composite = clamp(avg * 0.4 + peak * 0.6);

  const temps = hourly.map((h) => {
    const dom = computeTemperatureRisk(
      (h.factors.heat.value ?? h.factors.cold.value) as number,
      activity
    ).dominant;
    return dom;
  });
  const tempComposite = temps.reduce((s, t) => s + t.score, 0) / temps.length;
  const tempWorst = temps.reduce((m, t) => (t.score > m.score ? t : m), temps[0]);

  const rainComposite = hourly.reduce((s, h) => s + h.factors.rain.score, 0) / hourly.length;
  const rainWorst = hourly.reduce((m, h) => (h.factors.rain.score > m.score ? h.factors.rain : m), hourly[0].factors.rain);

  const windComposite = hourly.reduce((s, h) => s + h.factors.wind.score, 0) / hourly.length;
  const windWorst = hourly.reduce((m, h) => (h.factors.wind.score > m.score ? h.factors.wind : m), hourly[0].factors.wind);

  const visComposite = hourly.reduce((s, h) => s + h.factors.visibility.score, 0) / hourly.length;
  const visWorst = hourly.reduce((m, h) => (h.factors.visibility.score > m.score ? h.factors.visibility : m), hourly[0].factors.visibility);

  const uvComposite = hourly.reduce((s, h) => s + h.factors.uv.score, 0) / hourly.length;
  const uvWorst = hourly.reduce((m, h) => (h.factors.uv.score > m.score ? h.factors.uv : m), hourly[0].factors.uv);

  const wrapFactor = (
    worst: RiskFactor,
    compositeScore: number,
    extra: Partial<RiskFactor> = {}
  ): RiskFactor => ({
    ...worst,
    score: Math.round(clamp(worst.score * 0.6 + compositeScore * 0.4)),
    risk: scoreToRisk(clamp(worst.score * 0.6 + compositeScore * 0.4)),
    ...extra
  });

  return {
    overallRisk: scoreToRisk(composite),
    score: Math.round(composite),
    factors: {
      temperature: {
        ...(wrapFactor(tempWorst, tempComposite) as RiskFactor & { subType?: "heat" | "cold" }),
        subType: tempWorst.subType ?? "heat"
      },
      rain: wrapFactor(rainWorst, rainComposite),
      wind: wrapFactor(windWorst, windComposite),
      visibility: wrapFactor(visWorst, visComposite),
      uv: wrapFactor(uvWorst, uvComposite)
    }
  };
};

export const runRiskEngine = (
  weather: WeatherData,
  activity: ActivityType
): RiskResult => {
  const hourly = computeHourlyRisk(weather, activity);
  const recommendedWindows = findRecommendedWindows(hourly);
  const summary = summarizeOverallRisk(hourly, activity);
  const safestWindow =
    recommendedWindows[0] ??
    ({
      startHour: hourly[0].hour,
      endHour: hourly[0].hour + SAFE_WINDOW_DURATION_HOURS,
      startTime: formatHour(hourly[0].hour),
      endTime: formatHour(Math.min(24, hourly[0].hour + SAFE_WINDOW_DURATION_HOURS)),
      averageScore: hourly[0].overallScore,
      risk: hourly[0].overallRisk
    } as RecommendedWindow);

  return {
    ...summary,
    hourly,
    recommendedWindows,
    safestWindow,
    activity,
    dataTimestamp: new Date().toISOString()
  };
};

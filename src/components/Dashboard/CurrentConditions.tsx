import {
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  Eye,
  SunMedium,
  Cloud
} from "lucide-react";
import type { RiskResult, WeatherData } from "../../types";
import { ANALYSIS_HOURS } from "../../risk/config";

interface Props {
  weather: WeatherData;
  risk: RiskResult;
}

const pickHour = (weather: WeatherData, h: number) => {
  return (
    weather.hours.find((x) => x.hour === h) ??
    weather.hours[Math.floor(weather.hours.length / 2)]
  );
};

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  tone?: "low" | "medium" | "high";
}) {
  const toneColor =
    tone === "high"
      ? "text-risk-high"
      : tone === "medium"
      ? "text-risk-medium"
      : "text-risk-low";
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 font-semibold">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
      </div>
      <div className={`mt-2 text-2xl font-bold ${toneColor ?? "text-white"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export function CurrentConditions({ weather, risk }: Props) {
  const sample = pickHour(weather, 12);
  const tempTone =
    risk.factors.temperature.risk === "HIGH"
      ? "high"
      : risk.factors.temperature.risk === "MEDIUM"
      ? "medium"
      : "low";
  const rainTone =
    risk.factors.rain.risk === "HIGH"
      ? "high"
      : risk.factors.rain.risk === "MEDIUM"
      ? "medium"
      : "low";
  const windTone =
    risk.factors.wind.risk === "HIGH"
      ? "high"
      : risk.factors.wind.risk === "MEDIUM"
      ? "medium"
      : "low";

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Cloud className="w-5 h-5 text-nebula-400" /> Current Conditions
        </h3>
        <span className="text-xs text-gray-500">Sample at 12:00</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat
          icon={Thermometer}
          label="Temperature"
          value={`${sample.temperatureC.toFixed(0)}°C`}
          sub={`Feels like ${sample.feelsLikeC.toFixed(0)}°C`}
          tone={tempTone}
        />
        <Stat
          icon={CloudRain}
          label="Rain Probability"
          value={`${sample.precipitationProbability}%`}
          sub={`${sample.precipitationAmountMm.toFixed(1)} mm`}
          tone={rainTone}
        />
        <Stat
          icon={Wind}
          label="Wind"
          value={`${sample.windSpeedKmh.toFixed(0)} km/h`}
          sub={`Gusts ${sample.windGustKmh.toFixed(0)} km/h`}
          tone={windTone}
        />
        <Stat
          icon={Droplets}
          label="Humidity"
          value={`${sample.relativeHumidity}%`}
        />
        <Stat
          icon={Eye}
          label="Visibility"
          value={`${sample.visibilityKm.toFixed(1)} km`}
          tone={
            risk.factors.visibility.risk === "HIGH"
              ? "high"
              : risk.factors.visibility.risk === "MEDIUM"
              ? "medium"
              : "low"
          }
        />
        <Stat
          icon={SunMedium}
          label="UV Index"
          value={sample.uvIndex.toFixed(1)}
          sub={
            risk.factors.uv.risk === "HIGH"
              ? "Extreme"
              : risk.factors.uv.risk === "MEDIUM"
              ? "High"
              : "Moderate"
          }
          tone={
            risk.factors.uv.risk === "HIGH"
              ? "high"
              : risk.factors.uv.risk === "MEDIUM"
              ? "medium"
              : "low"
          }
        />
      </div>
    </div>
  );
}

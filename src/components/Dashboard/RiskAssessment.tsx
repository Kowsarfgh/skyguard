import { Shield, Thermometer, CloudRain, Wind, Eye, Sun } from "lucide-react";
import type { RiskResult } from "../../types";

function RiskGauge({ score, risk }: { score: number; risk: "LOW" | "MEDIUM" | "HIGH" }) {
  const color =
    risk === "HIGH" ? "#EF4444" : risk === "MEDIUM" ? "#F59E0B" : "#10B981";
  const dash = (score / 100) * 251.2;
  return (
    <div className="relative w-40 h-20 mx-auto">
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <defs>
          <linearGradient id="gauge-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="251.2"
          strokeDashoffset={251.2 - dash}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <div className="text-3xl font-bold" style={{ color }}>
          {score}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-gray-400">
          /100 score
        </div>
      </div>
    </div>
  );
}

function FactorRow({
  icon: Icon,
  label,
  value,
  risk,
  score,
  suffix
}: {
  icon: any;
  label: string;
  value: number | null;
  risk: "LOW" | "MEDIUM" | "HIGH";
  score: number;
  suffix?: string;
}) {
  const riskBadge =
    risk === "HIGH" ? "risk-badge-high" : risk === "MEDIUM" ? "risk-badge-medium" : "risk-badge-low";
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0 border-white/5">
      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-nebula-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-gray-200 font-medium">{label}</div>
          <div className={`${riskBadge} shrink-0`}>{risk}</div>
        </div>
        <div className="flex items-center justify-between mt-1 gap-2">
          <div className="text-xs text-gray-400 font-mono truncate">
            {value ?? "—"}{suffix ?? ""}
          </div>
          <div className="flex-1 mx-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${score}%`,
                background:
                  risk === "HIGH"
                    ? "#EF4444"
                    : risk === "MEDIUM"
                    ? "#F59E0B"
                    : "#10B981"
              }}
            />
          </div>
          <div className="text-xs text-gray-500 font-mono w-8 text-right">
            {score}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RiskAssessment({ risk }: { risk: RiskResult }) {
  const badgeClass =
    risk.overallRisk === "HIGH"
      ? "risk-badge-high"
      : risk.overallRisk === "MEDIUM"
      ? "risk-badge-medium"
      : "risk-badge-low";
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-nebula-400" /> Risk Assessment
        </h3>
        <div className={`${badgeClass}`}>{risk.overallRisk} Overall</div>
      </div>
      <RiskGauge score={risk.score} risk={risk.overallRisk} />
      <div className="mt-4 space-y-0.5">
        <FactorRow
          icon={Thermometer}
          label={risk.factors.temperature.subType === "cold" ? "Cold Stress" : "Heat Stress"}
          value={risk.factors.temperature.value}
          risk={risk.factors.temperature.risk}
          score={risk.factors.temperature.score}
          suffix="°C"
        />
        <FactorRow
          icon={CloudRain}
          label="Rain Risk"
          value={risk.factors.rain.value}
          risk={risk.factors.rain.risk}
          score={risk.factors.rain.score}
          suffix="% prob."
        />
        <FactorRow
          icon={Wind}
          label="Wind"
          value={risk.factors.wind.value}
          risk={risk.factors.wind.risk}
          score={risk.factors.wind.score}
          suffix=" km/h"
        />
        <FactorRow
          icon={Eye}
          label="Visibility"
          value={risk.factors.visibility.value}
          risk={risk.factors.visibility.risk}
          score={risk.factors.visibility.score}
          suffix=" km"
        />
        <FactorRow
          icon={Sun}
          label="UV Index"
          value={risk.factors.uv.value}
          risk={risk.factors.uv.risk}
          score={risk.factors.uv.score}
        />
      </div>
    </div>
  );
}

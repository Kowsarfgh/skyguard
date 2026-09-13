import { Clock, ShieldCheck } from "lucide-react";
import type { RiskResult } from "../../types";

export function TimelineVisualization({ risk }: { risk: RiskResult }) {
  const sorted = [...risk.hourly].sort((a, b) => a.hour - b.hour);
  const maxBar = 100;
  const safest = risk.safestWindow;
  const alt = risk.recommendedWindows;

  const barColor = (r: "LOW" | "MEDIUM" | "HIGH") =>
    r === "HIGH"
      ? "from-risk-high to-risk-high/60"
      : r === "MEDIUM"
      ? "from-risk-medium to-risk-medium/60"
      : "from-risk-low to-risk-low/60";

  return (
    <div className="glass-card p-5 space-y-5">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-nebula-400" /> Safest Time Window
          </h3>
          <div
            className={`${
              safest.risk === "HIGH"
                ? "risk-badge-high"
                : safest.risk === "MEDIUM"
                ? "risk-badge-medium"
                : "risk-badge-low"
            }`}
          >
            {safest.risk} · avg {safest.averageScore}/100
          </div>
        </div>

        <div className="flex items-center gap-4 bg-gradient-to-r from-nebula-500/15 via-starlight-500/10 to-transparent border border-starlight-500/20 rounded-2xl p-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-starlight-400 to-orange-500 flex items-center justify-center shadow-xl shadow-starlight-500/20 shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-starlight-400 font-bold">
              Recommended Window
            </div>
            <div className="text-2xl font-extrabold text-white mt-1 tracking-tight">
              {safest.startTime} – {safest.endTime}
            </div>
            <div className="text-sm text-gray-300 mt-1">
              Lowest combined environmental risk for the selected activity
            </div>
          </div>
        </div>
        {alt && alt.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {alt.slice(1).map((w, i) => (
              <div
                key={i}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 flex items-center gap-2"
              >
                <span className="text-gray-500">Alt #{i + 1}</span>
                <span className="font-mono">
                  {w.startTime}–{w.endTime}
                </span>
                <span
                  className={`${
                    w.risk === "HIGH"
                      ? "text-risk-high"
                      : w.risk === "MEDIUM"
                      ? "text-risk-medium"
                      : "text-risk-low"
                  } font-bold`}
                >
                  {w.risk}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-nebula-400 font-semibold mb-3">
          Hourly Risk Timeline
        </div>
        <div className="grid grid-cols-6 gap-2">
          {sorted.map((h) => {
            const inWindow = h.hour >= safest.startHour && h.hour < safest.endHour;
            return (
              <div key={h.hour} className="flex flex-col items-center gap-2">
                <div
                  className={`relative w-full rounded-xl overflow-hidden h-40 flex items-end border ${
                    inWindow
                      ? "border-starlight-400/60 ring-2 ring-starlight-400/30 bg-white/5"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div
                    className={`w-full bg-gradient-to-t ${barColor(h.overallRisk)} transition-all`}
                    style={{ height: `${(h.overallScore / maxBar) * 100}%` }}
                  />
                  <div className="absolute top-2 left-0 right-0 text-center text-[11px] font-bold text-white drop-shadow">
                    {h.overallScore}
                  </div>
                </div>
                <div
                  className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${
                    h.overallRisk === "HIGH"
                      ? "bg-risk-high/15 text-risk-high"
                      : h.overallRisk === "MEDIUM"
                      ? "bg-risk-medium/15 text-risk-medium"
                      : "bg-risk-low/15 text-risk-low"
                  }`}
                >
                  {h.overallRisk}
                </div>
                <div className="text-xs font-mono text-gray-400">{h.time}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { Globe, Cpu, Sparkles, ArrowDown } from "lucide-react";

const layers = [
  {
    icon: Globe,
    title: "SCIENCE",
    subtitle: "Environmental & Earth Observation Data",
    body: "Raw weather and solar data from Open-Meteo and NASA POWER — temperature, precipitation, wind, humidity, visibility, UV.",
    accent: "from-sky-400 to-blue-600",
    ring: "ring-sky-400/30"
  },
  {
    icon: Cpu,
    title: "COMPUTATION",
    subtitle: "Deterministic Risk Engine",
    body: "Transparent rule-based calculations with configurable thresholds per activity. No guessing. Scores, windows, and hazards are reproducible.",
    accent: "from-violet-400 to-indigo-600",
    ring: "ring-violet-400/30"
  },
  {
    icon: Sparkles,
    title: "AI",
    subtitle: "Gemini Interpretation",
    body: "Gemini explains the Risk Engine output, personalizes recommendations for your activity, and answers follow-up questions — it never recalculates risk.",
    accent: "from-amber-400 to-orange-500",
    ring: "ring-amber-400/30"
  }
];

export function DataTransparency() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-bold text-white mb-1">How was this calculated?</h3>
      <p className="text-sm text-gray-400 mb-6">
        Three clearly separated layers. <span className="text-starlight-400 font-semibold">The AI does NOT compute risk.</span>
      </p>

      <div className="space-y-2">
        {layers.map((L, idx) => {
          const Icon = L.icon;
          return (
            <div key={L.title}>
              <div
                className={`relative flex gap-4 p-4 rounded-2xl bg-card-gradient border border-white/10 ring-1 ${L.ring} hover:border-white/20 transition-colors`}
              >
                <div
                  className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${L.accent} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`text-[10px] uppercase tracking-[0.2em] font-extrabold bg-gradient-to-r ${L.accent} bg-clip-text text-transparent`}>
                      {L.title}
                    </div>
                  </div>
                  <div className="text-white font-semibold mt-0.5">{L.subtitle}</div>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">{L.body}</p>
                </div>
              </div>
              {idx < layers.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <ArrowDown className="w-3.5 h-3.5 text-nebula-400" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-space-900/50 border border-white/10 text-xs text-gray-400 leading-relaxed">
        <span className="text-starlight-400 font-bold uppercase tracking-widest mr-2">
          Disclaimer:
        </span>
        Gemini AI receives structured Risk Engine results and environmental observations only. It is instructed never to invent, recalculate, or override any risk score or weather value. The core science & computation always comes from the deterministic engine.
      </div>
    </div>
  );
}

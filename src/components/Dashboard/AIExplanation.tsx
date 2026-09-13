import { Sparkles, Lightbulb, Loader2 } from "lucide-react";
import type { AIExplanation } from "../../types";

export function AIExplanation({
  explanation,
  provider,
  loading
}: {
  explanation: AIExplanation | null;
  provider: "gemini" | "fallback" | null;
  loading: boolean;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-starlight-400" /> Why?
          <span className="text-xs text-gray-500 font-normal ml-1">
            AI Interpretation
          </span>
        </h3>
        <div
          className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${
            provider === "gemini"
              ? "bg-nebula-500/15 text-nebula-400 border border-nebula-500/30"
              : provider === "fallback"
              ? "bg-starlight-500/15 text-starlight-400 border border-starlight-500/30"
              : "bg-white/5 text-gray-400 border border-white/10"
          }`}
        >
          {provider === "gemini"
            ? "Gemini AI"
            : provider === "fallback"
            ? "Fallback Rule Engine"
            : "Pending"}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-11/12" />
          <div className="h-4 bg-white/10 rounded w-9/12" />
          <div className="h-4 bg-white/10 rounded w-10/12" />
          <div className="h-28 bg-white/5 rounded-xl mt-4" />
          <div className="h-36 bg-white/5 rounded-xl mt-3" />
        </div>
      ) : !explanation ? (
        <div className="py-10 text-center text-gray-500 text-sm">
          <Loader2 className="w-6 h-6 mx-auto mb-3 opacity-50" />
          Run analysis to generate an AI explanation
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-gray-200 leading-relaxed text-[15px]">
            {explanation.summary}
          </p>

          <div>
            <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
              Factor Breakdown
            </div>
            <ul className="space-y-2">
              {explanation.riskBreakdown.map((line, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm text-gray-200 bg-white/[0.04] border border-white/5 rounded-xl px-3 py-2.5"
                >
                  <span className="w-6 h-6 rounded-md bg-nebula-500/15 text-nebula-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-r from-starlight-500/10 via-nebula-500/10 to-transparent border border-starlight-500/15 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-starlight-500/15 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-starlight-400" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-starlight-400 font-bold mb-1">
                  Window Reasoning
                </div>
                <p className="text-gray-200 leading-relaxed text-sm">
                  {explanation.windowReasoning}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

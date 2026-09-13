import { CheckCircle2 } from "lucide-react";
import type { AIExplanation } from "../../types";

export function RecommendationsList({
  explanation
}: {
  explanation: AIExplanation | null;
}) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-risk-low" /> Recommendations
      </h3>
      {!explanation ? (
        <p className="text-sm text-gray-500">Run analysis for personalized tips.</p>
      ) : (
        <ul className="space-y-3">
          {explanation.recommendations.map((r, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-gray-200 leading-relaxed"
            >
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-risk-low to-emerald-500/50 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

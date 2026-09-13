import { useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { ShieldCheck, Orbit, AlertCircle, RotateCcw } from "lucide-react";
import type {
  AnalysisResult,
  AppError,
  AppStatus,
  ActivityType,
  Coordinates
} from "./types";
import { LocationMap } from "./components/Map/LocationMap";
import { InputPanel } from "./components/InputPanel/InputPanel";
import { CurrentConditions } from "./components/Dashboard/CurrentConditions";
import { RiskAssessment } from "./components/Dashboard/RiskAssessment";
import { TimelineVisualization } from "./components/Dashboard/TimelineVisualization";
import { AIExplanation } from "./components/Dashboard/AIExplanation";
import { RecommendationsList } from "./components/Dashboard/RecommendationsList";
import { DataTransparency } from "./components/Dashboard/DataTransparency";
import { ChatPanel } from "./components/Chat/ChatPanel";
import { fetchWeatherData, reverseGeocode, getEffectiveLocation } from "./services/api";
import { DEMO_LOCATION } from "./services/api/mockData";
import { runRiskEngine } from "./risk/engine";
import { generateExplanation } from "./services/gemini";

const Stars = () => {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 3
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {stars.map((s) => (
        <span
          key={s.id}
          className="star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`
          }}
        />
      ))}
    </div>
  );
};

const initialCoords: Coordinates = {
  latitude: DEMO_LOCATION.latitude,
  longitude: DEMO_LOCATION.longitude,
  placeName: DEMO_LOCATION.placeName
};

function App() {
  const [location, setLocation] = useState<Coordinates>(initialCoords);
  const [date, setDate] = useState<string>(() =>
    format(addDays(new Date(), 1), "yyyy-MM-dd")
  );
  const [activity, setActivity] = useState<ActivityType>("hiking");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const handleMapChange = async (c: Coordinates) => {
    setLocation(c);
    if (!c.placeName) {
      try {
        const name = await reverseGeocode(c.latitude, c.longitude);
        if (name) setLocation((prev) => ({ ...prev, placeName: name }));
      } catch {
        /* ignore */
      }
    }
  };

  const reset = () => {
    setStatus("idle");
    setAnalysis(null);
    setError(null);
    setAiLoading(false);
  };

  const runAnalysis = async (isDemo: boolean) => {
    setDemoMode(isDemo);
    setStatus("loading");
    setError(null);
    setAiLoading(true);
    setAnalysis(null);
    try {
      const input = {
        location: isDemo ? DEMO_LOCATION : location,
        date,
        activity,
        isDemo
      };
      const effectiveLocation = getEffectiveLocation(input);
      if (isDemo) setLocation(DEMO_LOCATION);
      const weather = await fetchWeatherData(input);
      const risk = runRiskEngine(weather, activity);
      const baseResult: AnalysisResult = {
        input: { ...input, location: effectiveLocation },
        weather,
        risk,
        ai: null,
        aiProvider: null
      };
      setStatus("success");
      setAnalysis(baseResult);
      const { explanation, provider } = await generateExplanation(baseResult);
      setAnalysis((prev) =>
        prev ? { ...prev, ai: explanation, aiProvider: provider } : prev
      );
      setAiLoading(false);
    } catch (e: any) {
      setStatus("error");
      setAiLoading(false);
      setError({
        code: "ANALYSIS_FAILED",
        message:
          e?.message?.toString?.() ??
          "Unable to complete analysis. Please check your connection and try again.",
        detail: isDemo ? "Demo mode" : undefined
      });
    }
  };

  const showResults = status === "success" || status === "error";

  return (
    <div className="min-h-screen relative">
      <Stars />

      <header className="border-b border-white/10 bg-space-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-nebula-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-nebula-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-white tracking-tight">
                SkyGuard
              </div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-nebula-400 font-bold">
                Outdoor Safety Analyzer
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Orbit className="w-3.5 h-3.5 animate-spin-slow" />
              <span>NASA Space Apps Inspired</span>
            </div>
            {status === "success" && (
              <button className="btn-secondary !py-2 !px-4 text-sm" onClick={reset}>
                <RotateCcw className="w-4 h-4" /> New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section className="text-center max-w-3xl mx-auto pt-2 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-starlight-500/10 border border-starlight-500/20 text-starlight-400 text-xs font-bold uppercase tracking-widest mb-4">
            Science · Computation · AI
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-nebula-200 to-starlight-300 bg-clip-text text-transparent">
            Discover the safest time to go outside
          </h1>
          <p className="mt-3 text-gray-400 text-base sm:text-lg leading-relaxed">
            Choose any location, pick your activity, and get a transparent risk
            assessment powered by environmental data, a deterministic Risk
            Engine, and Gemini AI explanations.
          </p>
        </section>

        {error && status === "error" && (
          <div className="glass-card border-risk-high/30 p-5 flex items-start gap-4 bg-risk-high/5">
            <AlertCircle className="w-6 h-6 text-risk-high shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-risk-high">{error.code}</div>
              <div className="text-sm text-gray-300 mt-1">{error.message}</div>
              {error.detail && (
                <div className="text-xs text-gray-500 mt-1">{error.detail}</div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-secondary !py-2 !px-4 text-sm" onClick={() => runAnalysis(demoMode)}>
                  Retry
                </button>
                <button
                  className="btn-primary !py-2 !px-4 text-sm"
                  onClick={() => runAnalysis(true)}
                >
                  Switch to Demo
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <LocationMap
              location={location}
              onChange={handleMapChange}
              height={status === "idle" ? "520px" : "420px"}
              demoMode={demoMode}
            />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-5">
            <InputPanel
              location={location}
              date={date}
              activity={activity}
              onDate={setDate}
              onActivity={setActivity}
              onAnalyze={() => runAnalysis(false)}
              onDemo={() => runAnalysis(true)}
              loading={status === "loading"}
            />
          </div>
        </section>

        {showResults && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-5">
              {status === "success" && analysis && (
                <>
                  <CurrentConditions weather={analysis.weather} risk={analysis.risk} />
                  <TimelineVisualization risk={analysis.risk} />
                  <AIExplanation
                    explanation={analysis.ai}
                    provider={analysis.aiProvider}
                    loading={aiLoading}
                  />
                  <DataTransparency />
                </>
              )}
            </div>
            <div className="space-y-5">
              {status === "success" && analysis && (
                <>
                  <RiskAssessment risk={analysis.risk} />
                  <RecommendationsList explanation={analysis.ai} />
                  <ChatPanel analysis={analysis} />
                </>
              )}
            </div>
          </section>
        )}

        <footer className="mt-16 pt-8 border-t border-white/5 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2 pb-8">
          <div>SkyGuard · NASA Space Apps Challenge-style project · OpenStreetMap · Open-Meteo · NASA POWER · Gemini</div>
          <div className="flex items-center gap-4">
            <span>Data sources: Science (real-time obs) · Computation (rules) · AI (explain)</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;

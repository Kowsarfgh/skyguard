import { format, addDays } from "date-fns";
import { MapPin, Calendar, Mountain, Tent, Fish, Bike, Umbrella, Camera, Plane, Compass, Sparkles, Zap, Loader2 } from "lucide-react";
import type { ActivityMeta, ActivityType, Coordinates } from "../../types";
import { ACTIVITIES } from "../../types";

const ICONS: Record<string, any> = {
  Mountain, Tent, Fish, Bike, Umbrella, Camera, Plane, Compass
};

export interface InputPanelProps {
  location: Coordinates;
  date: string;
  activity: ActivityType;
  onDate: (d: string) => void;
  onActivity: (a: ActivityType) => void;
  onAnalyze: () => void;
  onDemo: () => void;
  loading: boolean;
}

const minDate = () => format(new Date(), "yyyy-MM-dd");
const maxDate = () => format(addDays(new Date(), 7), "yyyy-MM-dd");

export function InputPanel({
  location,
  date,
  activity,
  onDate,
  onActivity,
  onAnalyze,
  onDemo,
  loading
}: InputPanelProps) {
  return (
    <div className="glass-card p-5 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-nebula-400 font-semibold">
          <MapPin className="w-3.5 h-3.5" /> Selected Location
        </div>
        <div className="text-lg font-semibold text-white line-clamp-1">
          {location.placeName ?? "Click on map to choose location"}
        </div>
        <div className="font-mono text-sm text-gray-400 mt-1">
          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-nebula-400 font-semibold">
          <Calendar className="w-3.5 h-3.5" /> Date
        </label>
        <input
          type="date"
          className="input-field"
          value={date}
          min={minDate()}
          max={maxDate()}
          onChange={(e) => onDate(e.target.value)}
        />
        <div className="text-xs text-gray-500 mt-1">
          Available: today through +7 days forecast
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-nebula-400 font-semibold">
          <Compass className="w-3.5 h-3.5" /> Activity
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ACTIVITIES.map((a: ActivityMeta) => {
            const Icon = ICONS[a.icon] ?? Compass;
            const active = a.id === activity;
            return (
              <button
                key={a.id}
                onClick={() => onActivity(a.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  active
                    ? "bg-nebula-500/20 border-nebula-500/60 text-white shadow-lg shadow-nebula-500/10"
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          className="btn-primary flex-1"
          onClick={onAnalyze}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" /> Analyze Conditions
            </>
          )}
        </button>
        <button
          className="btn-secondary flex-1 sm:flex-none"
          onClick={onDemo}
          disabled={loading}
        >
          <Sparkles className="w-4 h-4" /> Try Demo
        </button>
      </div>
    </div>
  );
}

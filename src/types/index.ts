export type ActivityType =
  | "hiking"
  | "camping"
  | "fishing"
  | "cycling"
  | "beach"
  | "photography"
  | "traveling"
  | "other";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Coordinates {
  latitude: number;
  longitude: number;
  placeName?: string;
}

export interface ActivityMeta {
  id: ActivityType;
  label: string;
  icon: string;
}

export const ACTIVITIES: ActivityMeta[] = [
  { id: "hiking", label: "Hiking", icon: "Mountain" },
  { id: "camping", label: "Camping", icon: "Tent" },
  { id: "fishing", label: "Fishing", icon: "Fish" },
  { id: "cycling", label: "Cycling", icon: "Bike" },
  { id: "beach", label: "Beach Activity", icon: "Umbrella" },
  { id: "photography", label: "Photography", icon: "Camera" },
  { id: "traveling", label: "Traveling", icon: "Plane" },
  { id: "other", label: "Other", icon: "Compass" }
];

export interface WeatherConditions {
  timestamp: string;
  hour: number;
  temperatureC: number;
  feelsLikeC: number;
  precipitationProbability: number;
  precipitationAmountMm: number;
  windSpeedKmh: number;
  windGustKmh: number;
  relativeHumidity: number;
  visibilityKm: number;
  weatherCode: number;
  uvIndex: number;
  cloudCover: number;
}

export interface WeatherData {
  location: Coordinates;
  date: string;
  hours: WeatherConditions[];
}

export interface RiskFactor {
  value: number | null;
  risk: RiskLevel;
  score: number;
  label: string;
  description?: string;
}

export interface HourlyRisk {
  hour: number;
  time: string;
  overallScore: number;
  overallRisk: RiskLevel;
  factors: {
    heat: RiskFactor;
    cold: RiskFactor;
    rain: RiskFactor;
    wind: RiskFactor;
    visibility: RiskFactor;
    uv: RiskFactor;
  };
}

export interface RecommendedWindow {
  startHour: number;
  endHour: number;
  startTime: string;
  endTime: string;
  averageScore: number;
  risk: RiskLevel;
}

export interface RiskResult {
  overallRisk: RiskLevel;
  score: number;
  factors: {
    temperature: RiskFactor & { subType: "heat" | "cold" };
    rain: RiskFactor;
    wind: RiskFactor;
    visibility: RiskFactor;
    uv: RiskFactor;
  };
  hourly: HourlyRisk[];
  recommendedWindows: RecommendedWindow[];
  safestWindow: RecommendedWindow;
  activity: ActivityType;
  dataTimestamp: string;
}

export interface AnalysisInput {
  location: Coordinates;
  date: string;
  activity: ActivityType;
  isDemo?: boolean;
}

export interface AnalysisResult {
  input: AnalysisInput;
  weather: WeatherData;
  risk: RiskResult;
  ai: AIExplanation | null;
  aiProvider: "gemini" | "fallback" | null;
}

export interface AIExplanation {
  summary: string;
  riskBreakdown: string[];
  windowReasoning: string;
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isFallback?: boolean;
}

export type AppStatus = "idle" | "loading" | "success" | "error";

export interface AppError {
  code: string;
  message: string;
  detail?: string;
}

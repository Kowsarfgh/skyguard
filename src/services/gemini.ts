import type { AIExplanation, AnalysisResult, ChatMessage } from "../types";
import { generateFallbackExplanation, answerFollowUpFallback } from "./fallbackExplanation";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const geminiKey = (): string | null => {
  try {
    const v = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (typeof v === "string" && v.trim().length > 0 && !v.includes("your_") && !v.includes("xxx")) {
      return v.trim();
    }
    return null;
  } catch {
    return null;
  }
};

const buildExplanationPrompt = (ctx: AnalysisResult): string => {
  const { input, risk, weather } = ctx;
  const place = input.location.placeName
    ? input.location.placeName
    : `${input.location.latitude.toFixed(4)}, ${input.location.longitude.toFixed(4)}`;
  return `You are an outdoor safety assistant for SkyGuard.

ROLE RULES (STRICT):
- The RISK has been calculated by a deterministic Risk Engine — do NOT recalculate, modify, invent, or override any risk values.
- Do NOT invent weather values beyond what is provided.
- Base EVERY statement on the JSON data only.
- Keep paragraphs short and clear.

CONTEXT:
- Location: ${place}
- Date: ${input.date}
- Activity: ${input.activity}
- Data source: Open-Meteo + NASA POWER environmental observations.

RISK ENGINE RESULT (JSON):
${JSON.stringify(
  {
    overallRisk: risk.overallRisk,
    score: risk.score,
    factors: risk.factors,
    safestWindow: risk.safestWindow,
    recommendedWindows: risk.recommendedWindows,
    hourlySummary: risk.hourly.map((h) => ({
      time: h.time, risk: h.overallRisk, score: h.overallScore
    }))
  },
  null,
  2
)}

SAMPLE OF HOURLY ENVIRONMENTAL DATA:
${JSON.stringify(
  weather.hours
    .filter((h) => [6, 9, 12, 15, 18, 21].includes(h.hour))
    .map((h) => ({
      hour: `${h.hour.toString().padStart(2, "0") + ":00"}`,
      tempC: h.temperatureC,
      rainProb: h.precipitationProbability,
      rainMm: h.precipitationAmountMm,
      windKmh: h.windSpeedKmh,
      gustKmh: h.windGustKmh,
      humidity: h.relativeHumidity,
      uv: h.uvIndex,
      visKm: h.visibilityKm
    })),
  null,
  2
)}

RESPONSE FORMAT (VALID JSON ONLY, NO OTHER TEXT):
{
  "summary": "1 short paragraph explaining overall conditions and overall risk for the chosen activity",
  "riskBreakdown": [
    "Sentence for each of the top factors (3-4 bullets)",
    "..."
  ],
  "windowReasoning": "1 short sentence explaining WHY the safest recommended window is preferable, naming specific factors",
  "recommendations": [
    "Practical recommendation for the activity, tailored to ${input.activity}",
    "... (3-6 bullets)
  ]
}`;
};

const parseJSONish = (text: string): any => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const trimmed = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  try {
    return JSON.parse(trimmed);
  } catch {
    const fallback = { summary: text.replace(/[{}]/g, "").trim() };
    return fallback;
  }
};

const callGemini = async (prompt: string, key: string): Promise<any> => {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "text/plain"
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
    ]
  };
  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}`);
  }
  const json = await res.json();
  const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join(" ");
  return parseJSONish(text);
};

export const isGeminiConfigured = (): boolean => geminiKey() != null;

export const generateExplanation = async (
  result: AnalysisResult
): Promise<{ explanation: AIExplanation; provider: "gemini" | "fallback" }> => {
  const key = geminiKey();
  if (!key) {
    return { explanation: generateFallbackExplanation(result), provider: "fallback" };
  }
  try {
    const data = await callGemini(buildExplanationPrompt(result), key);
    const explanation: AIExplanation = {
      summary:
        typeof data.summary === "string" ? data.summary : generateFallbackExplanation(result).summary,
      riskBreakdown: Array.isArray(data.riskBreakdown)
        ? data.riskBreakdown.filter((x: any) => typeof x === "string")
        : generateFallbackExplanation(result).riskBreakdown,
      windowReasoning:
        typeof data.windowReasoning === "string"
          ? data.windowReasoning
          : generateFallbackExplanation(result).windowReasoning,
      recommendations: Array.isArray(data.recommendations)
        ? data.recommendations.filter((x: any) => typeof x === "string")
        : generateFallbackExplanation(result).recommendations
    };
    return { explanation, provider: "gemini" };
  } catch (err) {
    console.warn("Gemini failed, falling back:", err);
    return { explanation: generateFallbackExplanation(result), provider: "fallback" };
  }
};

const buildFollowUpPrompt = (question: string, ctx: AnalysisResult): string => {
  return `You are an outdoor safety assistant for SkyGuard. Answer the user's follow-up question.

RULES (STRICT):
- NEVER invent weather/risk values.
- NEVER override Risk Engine output.
- If you don't know based on the context, say so briefly.
- Keep answers concise (2-4 sentences).

CONTEXT (Risk Engine result JSON):
${JSON.stringify(
  {
    overallRisk: ctx.risk.overallRisk,
    score: ctx.risk.score,
    factors: ctx.risk.factors,
    safestWindow: ctx.risk.safestWindow,
    hourly: ctx.risk.hourly.map((h) => ({ time: h.time, risk: h.overallRisk, score: h.overallScore }))
  },
  null,
  2
)}

USER QUESTION:
${question}

ANSWER (plain text only):`;
};

export const answerFollowUp = async (
  question: string,
  ctx: AnalysisResult
): Promise<{ answer: string; provider: "gemini" | "fallback" }> => {
  const key = geminiKey();
  if (!key) {
    return { answer: answerFollowUpFallback(question, ctx), provider: "fallback" };
  }
  try {
    const prompt = buildFollowUpPrompt(question, ctx);
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
    };
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const json = await res.json();
    const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? "").join(" ").trim();
    if (text.length === 0) throw new Error("Empty response");
    return { answer: text, provider: "gemini" };
  } catch (err) {
    console.warn("Gemini follow-up failed, falling back:", err);
    return { answer: answerFollowUpFallback(question, ctx), provider: "fallback" };
  }
};

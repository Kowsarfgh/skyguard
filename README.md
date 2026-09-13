# SkyGuard · Outdoor Safety Analyzer

A NASA Space Apps Challenge-style web application that provides **transparent** outdoor activity safety and weather risk assessments.

Architecture is strictly separated into three layers:

1. **SCIENCE** — Environmental and Earth observation data (Open-Meteo + NASA POWER)
2. **COMPUTATION** — Deterministic Rule-based Risk Engine (scores, factors, safe windows)
3. **AI** — Gemini interprets the pre-computed Risk Engine results, explains them, and answers follow-up questions. **Gemini never recalculates or invents risk.**

## ✨ Features

- 🌍 Interactive **Leaflet + OpenStreetMap** — click anywhere on Earth, drag, zoom, marker, coordinates display, plus Nominatim place search (no paid Google Maps).
- 📅 **Date picker** with today … +7 days forecast horizon
- 🥾 **8 activity presets** with tuned thresholds: Hiking, Camping, Fishing, Cycling, Beach, Photography, Traveling, Other
- 🧪 **Deterministic Risk Engine** (`src/risk/engine.ts`): heat, cold, rain, wind, visibility, UV scores with central config
- ⏰ Multi-hour timeline (06:00–21:00) + **Safest Time Window** selected by the engine only
- 🤖 **Gemini AI** for explanations, activity-personalized recommendations, and follow-up Q&A
- 🔁 **Rule-based fallback** explanation + chat generator with clear watermark if Gemini is unavailable
- 🎭 **Demo Mode** with realistic mock data (Tabriz, Iran) — full flow works with **zero API keys**
- 🪟 NASA-inspired dark-space UI, glassmorphism, gradients, responsive grid layout
- 🔎 **Data Transparency** section visibly showing the 3 layers + disclaimer that AI does NOT compute risk
- 🛡️ Error handling + never displays `undefined` / `null` in the UI
- 🔐 API keys via environment variables only

## 🧱 Tech Stack

- **React 18 + TypeScript + Vite 5**
- **Tailwind CSS 3** (custom space/NASA theme)
- **Leaflet** + **react-leaflet** + **CartoDB Dark Matter tiles** + **Nominatim** (search / reverse geocoding)
- **Open-Meteo** for primary hourly forecast (no key)
- **NASA POWER** for UV / solar + supplementary daily values (no key)
- **Google Gemini 1.5 Flash** for AI explanation + chat (`VITE_GEMINI_API_KEY`, optional)
- **lucide-react** icons, **date-fns** for date math

## 🗂️ Project Structure

```
src/
  types/                 Shared TypeScript types
  risk/
    config.ts            Central thresholds per activity   ← adjust risk here
    engine.ts            Pure deterministic Risk Engine functions
  services/
    api/
      openMeteo.ts       Open-Meteo fetch + transform
      nasaPower.ts       NASA POWER fetch (UV/solar)
      mockData.ts        Demo mock weather data
      index.ts           Unified weather + geocode facade
    gemini.ts            Gemini prompt + generateExplanation + followUp
    fallbackExplanation.ts Rule-based generator (watermarked fallback)
  components/
    Map/                 Leaflet map + search
    InputPanel/          Location / Date / Activity / Analyze / Try Demo
    Dashboard/           Conditions, Risk gauge, Timeline, AI explain, Recs, Transparency
    Chat/                Follow-up chat panel
  App.tsx                State machine + orchestration
  main.tsx               React entry
  index.css              Tailwind + global classes
```

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Copy env and add a Gemini key
cp .env.example .env.local
#   Edit .env.local → VITE_GEMINI_API_KEY=YOUR_KEY_HERE

# 3. Start dev server
npm run dev
#   Then open the printed URL (http://localhost:5173)
```

> **No API key? No problem.** Click **Try Demo** on the homepage — the complete flow runs with mock data and a rule-based fallback AI.

## 🔑 Environment Variables

Create `.env.local` (gitignored):

```dotenv
# Gemini API key (optional)
VITE_GEMINI_API_KEY=
```

See `.env.example` for template.

## 🧪 Production Build

```bash
npm run build
npm run preview
```

## 🧠 Architecture Diagram

```
Open-Meteo / NASA POWER
         │  Raw environmental obs
         ▼
   Data Processing
         │  Typed WeatherConditions[]
         ▼
   ┌──────────────────┐
   │  RISK ENGINE     │  ← src/risk/config.ts + engine.ts (PURE, testable)
   │  • per-factor    │
   │  • per-hour      │
   │  • safe window   │
   └────────┬─────────┘
            │  Structured RiskResult JSON
            ▼
   ┌──────────────────┐
   │   GEMINI AI      │  ← Explains only. NEVER recalculates risk.
   │   (or fallback)  │    • personalized summary
   │                  │    • recommendations
   └────────┬─────────┘    • follow-up Q&A
            │
            ▼
          User
```

## 🧭 How the Risk Engine Works

Each factor returns a 0–100 score with explicit thresholds from `src/risk/config.ts`:

- **Temperature** → heat risk OR cold risk dominant
- **Rain** → probability (60%) + amount (40%) weighted
- **Wind** → sustained (60%) + gusts (40%) weighted
- **Visibility** → inverted (lower km = higher score)
- **UV** → linear to index

Per-activity **weight multipliers** (fishing weights visibility higher; cycling weights wind higher; etc.) combine factors → overall hourly score → timeline → **safest 3-hour window** by lowest avg + peak composite.

Overall day score = `avg(hourly) * 0.4 + peak(hourly) * 0.6`.

Everything is independently unit-testable in `src/risk/engine.ts` (no React or API imports).

## 🛡️ AI Grounding

The Gemini prompts include the instruction:

> The RISK has been calculated by a deterministic Risk Engine — do NOT recalculate, modify, invent, or override any risk values. Do NOT invent weather values beyond what is provided.

Follow-up chat only receives the **already-computed RiskResult + context**, not raw weather APIs. If Gemini fails or has no key, a rule-based generator answers and is **visibly labelled "Rule-based fallback · Gemini unavailable"**.

## 🚩 Error Handling

- Invalid coordinates → clamped / user-message
- Weather API failures → actionable error card with Retry + Switch to Demo
- Missing Gemini key → seamless Demo/fallback path (no UI errors)
- Invalid dates → HTML5 date min/max (today..+7)
- `undefined` / `null` never rendered; all numeric fallbacks are present

## ✅ Full-Flow Test Checklist

1. ✅ Open page → dark space UI renders, map centered on Tabriz (demo default)
2. ✅ Click map anywhere → marker updates, lat/lon readout, reverse geocode (if network OK)
3. ✅ Use map search bar → Nominatim suggestions → pick a city → map flies there
4. ✅ Pick a date within 8 days, select Hiking
5. ✅ Click **Analyze Conditions** → loading → success
6. ✅ Risk gauge shows score, per-factor bars, colors match LOW/MEDIUM/HIGH
7. ✅ Timeline shows 6 hourly bars; safest window highlighted (gold ring); alternatives listed
8. ✅ AI explanation panel shows summary, breakdown, window reasoning (or skeleton loading → filled; or "Rule-based fallback" badge)
9. ✅ Recommendations appear
10. ✅ Transparency section shows 3 layers (Science → Computation → AI) with disclaimer
11. ✅ **Ask AI**: pick "Why is 3 PM risky?" → answer using existing results only, no new fetch; answer shows fallback badge if no key
12. ✅ **Try Demo** → runs with zero keys, full flow, no exceptions
13. ✅ `npm run build` → no TS errors, no Vite build errors

Built as a submission-ready NASA Space Apps Challenge-style prototype.

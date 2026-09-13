# SkyGuard - Outdoor Safety Analyzer - Implementation Plan

## Task 1: Scaffold project (Vite + React + TypeScript + Tailwind)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Initialize Vite React TypeScript project in root directory
  - Install Tailwind CSS and configure with dark space-inspired theme colors
  - Install core dependencies: leaflet, react-leaflet, lucide-react, date-fns
  - Set up base src/ directory structure (components/, services/, api/, utils/, risk/, hooks/, types/)
- **Acceptance Criteria Addressed**: AC-8, AC-9, AC-12
- **Test Requirements**:
  - `rule` TR-1.1: `npm run dev` starts without errors; Vite dev server serves index.html at localhost
  - `rule` TR-1.2: Tailwind dark class renders dark background; src/ subdirectories exist
  - `rubric` TR-1.3: Theme colors are NASA-inspired dark blues/purples/cyan accents; scale 1-5; anchors 1=no theme, 3=basic dark, 5=space-inspired palette matching spec; threshold >= 4; evidence: Tailwind config + App.tsx render

## Task 2: Define types, risk config, and Risk Engine
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Create src/types/index.ts with WeatherData, RiskAssessment, RiskFactors, TimeWindowRisk, AnalysisResult, Activity types
  - Create src/risk/config.ts with central configurable thresholds for heat, cold, rain, wind, visibility, UV (LOW/MEDIUM/HIGH ranges)
  - Create src/risk/engine.ts with pure functions: calculateFactorRisk, calculateOverallRisk, calculateTimeWindows, identifySafestWindow; no React deps; independently testable
- **Acceptance Criteria Addressed**: AC-3, AC-4
- **Test Requirements**:
  - `rule` TR-2.1: `calculateRisk(weatherData)` returns object with overallRisk ∈ {LOW,MEDIUM,HIGH}, score ∈ 0-100, factors with per-factor risk, recommendedWindows array
  - `rule` TR-2.2: For a test case with high rain (prob 85%) and low wind, rain factor returns HIGH risk; overall risk HIGH
  - `rule` TR-2.3: `identifySafestWindow` returns window with lowest aggregate score (verified by brute-force compare) among 3-hour windows across the day
  - `rubric` TR-2.4: Thresholds are all in one config file (risk/config.ts), not scattered; scale 1-5; anchors 1=thresholds inline in engine, 3=some config but still inline values, 5=clean single config export with doc comments; threshold >= 4

## Task 3: Weather API services (Open-Meteo + NASA POWER + mock/demo data)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - Create src/services/api/openMeteo.ts: fetch hourly + daily weather for coords + date; map response to WeatherData type
  - Create src/services/api/nasaPower.ts: optional solar/UV data supplement; graceful fallback if API unreachable
  - Create src/services/api/mockData.ts: realistic demo data for Tabriz, Iran (38.0962, 46.2738) for a sample date; includes hourly variation (morning cool, noon hot, afternoon rain, evening wind)
  - Create src/services/api/index.ts: unified orchestrator that routes to real or mock/demo data based on demo flag or API failure
- **Acceptance Criteria Addressed**: AC-2, AC-7, AC-11
- **Test Requirements**:
  - `rule` TR-3.1: `fetchWeatherData(38.0962, 46.2738, date)` resolves to WeatherData with temp, rainProbability, windSpeed, humidity, visibility, uvIndex, hourlyData array of 6+ slots
  - `rule` TR-3.2: `fetchWeatherData` when given demo=true returns mock data matching Tabriz coords; no network calls made
  - `rule` TR-3.3: When API fetch fails (network error), service throws a typed Error with user-friendly message rather than unhandled rejection

## Task 4: Gemini AI service (explanations + chat) with fallback
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2, Task 3
- **Description**:
  - Create src/services/gemini.ts: structured system prompt + user prompt template; receives RiskEngineResult + Activity + location/date only; sends to `/v1beta/models/gemini-1.5-flash:generateContent` via fetch with `GEMINI_API_KEY` from import.meta.env
  - Implement `generateExplanation(result, activity, location)`; structured prompt forbids inventing values or overriding risk
  - Implement `answerFollowUp(question, fullAnalysisState)` with context window containing only stored results
  - Create fallback explanation generator `src/services/fallbackExplanation.ts`: rule-based text generation from structured risk result; clearly watermarked as "Structured Explanation (AI unavailable)"
  - Create facade `getExplanation()` that tries Gemini first then falls back automatically on failure/missing-key
- **Acceptance Criteria Addressed**: AC-5, AC-6, AC-7, AC-11
- **Test Requirements**:
  - `rule` TR-4.1: `gemini.ts` prompt text includes the sentence "Do not recalculate or modify the risk; do not invent weather information."
  - `rule` TR-4.2: When `import.meta.env.VITE_GEMINI_API_KEY` is empty/missing, `getExplanation()` returns fallback text with the watermark "Structured Explanation" and does not call any fetch
  - `rule` TR-4.3: `answerFollowUp` receives only `analysisState` as data source; no new weather API calls in its body

## Task 5: Interactive Map component (Leaflet + search)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Create `src/components/Map/LocationMap.tsx`: full-height Leaflet map with OpenStreetMap tiles; click-to-place-marker; zoom/pan
  - Store selected location in a prop/state: `{lat, lon, label}`
  - Optional Nominatim-based search bar `MapSearch.tsx` for city/place lookup (reverse geocode click for label too)
  - Display lat/lon readout below map in input panel
- **Acceptance Criteria Addressed**: AC-1, AC-11
- **Test Requirements**:
  - `rule` TR-5.1: Clicking anywhere on map fires onLocationChange callback with {lat, lon} matching click coords; marker appears
  - `rule` TR-5.2: Map renders with tile layers; zoom in/out buttons work; no console errors
  - `rule` TR-5.3: If geocode service unavailable, label falls back to "Selected Location" and lat/lon still shown

## Task 6: Input panel (Location display, Date picker, Activity select, Analyze + Try Demo buttons)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - Create `src/components/InputPanel/InputPanel.tsx`: shows Selected Location name + coordinates, HTML date input (min=today, max=today+7 days), Activity dropdown (Hiking, Camping, Fishing, Cycling, Beach, Photography, Traveling, Other), "Analyze Conditions" primary button, and "Try Demo" secondary button
  - Activity type stored in state
  - Disable Analyze button while loading; show spinner
- **Acceptance Criteria Addressed**: AC-1, AC-7, AC-11
- **Test Requirements**:
  - `rule` TR-6.1: Date picker rejects dates outside min/max (browser native)
  - `rule` TR-6.2: "Try Demo" sets demo flag and populates Tabriz coords + sample date + activity in state
  - `rule` TR-6.3: While analysis is loading, Analyze button is disabled and shows spinner; no double-fires on rapid click

## Task 7: Results dashboard components (Conditions, Risk, Timeline, AI, Recommendations, Transparency)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2, Task 3
- **Description**:
  - `CurrentConditions.tsx`: Grid cards with temp, rain%, wind, humidity, visibility, UV; glass cards with icons (lucide-react)
  - `RiskAssessment.tsx`: Overall Risk big badge (green/yellow/red), score 0-100 gauge (progress bar), per-factor rows with colored risk badges
  - `TimelineVisualization.tsx`: Row of time slots (06:00, 09:00, ...) each with color-coded risk pill; highlight the 3-hour safest window
  - `AIExplanation.tsx`: Card with Gemini explanation (or fallback watermarked text); loading skeleton
  - `RecommendationsList.tsx`: Bullet list of personalized recommendations extracted from AI text or fallback
  - `DataTransparency.tsx`: "How was this calculated?" section with 3 arrows: NASA/Weather → Environmental → Risk Engine → Risk Score → Gemini → Explanation; text explicitly saying AI does NOT calculate risk
- **Acceptance Criteria Addressed**: AC-5, AC-7, AC-9, AC-10
- **Test Requirements**:
  - `rule` TR-7.1: Risk badge colors: LOW=green, MEDIUM=yellow/amber, HIGH=red/crimson; consistent across components
  - `rule` TR-7.2: Timeline renders 6+ time slots; safest window's background is highlighted
  - `rule` TR-7.3: DataTransparency component renders 3 layer labels + arrows
  - `rubric` TR-7.4: Overall dashboard looks like a polished NASA-inspired hackathon UI; scale 1-5; anchors 1=raw divs, 3=basic cards, 5=glassmorphism + gradients + consistent spacing; threshold >= 4; evidence: screenshot

## Task 8: AI Chat assistant panel
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 4
- **Description**:
  - `ChatPanel.tsx`: Scrollable message area + text input + "Ask" button
  - First message is a system welcome: "Ask about the risk results..."
  - User messages route to `answerFollowUp(question, analysis)`
  - Append messages to chat log; show typing indicator while AI thinks
  - All answers prefixed with a tiny disclaimer: "Based on pre-calculated results"
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-8.1: Submitting a question appends user message + AI response; no new network request to Open-Meteo/NASA occurs (verified in Network tab during Task 4 review)
  - `rule` TR-8.2: If analysis hasn't run yet, chat input is disabled and placeholder says "Run analysis first"

## Task 9: Error handling, loading states, env setup, README
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: All tasks 1-8
- **Description**:
  - Create `.env.example` with required variables: `VITE_GEMINI_API_KEY=your_key_here` and any NASA key if used
  - Create `.env.local` with empty/demo values (gitignore'd)
  - Global ErrorBoundary for top-level crashes
  - Toast/inline message component for: invalid coords, API fail, missing weather data, bad date, network error
  - Update `index.css` with Tailwind directives + custom scrollbar + global dark theme
  - Create README.md with: project title, description, architecture diagram note, setup (npm install, configure env, npm run dev), demo mode usage, tech stack
- **Acceptance Criteria Addressed**: AC-11, AC-12
- **Test Requirements**:
  - `rule` TR-9.1: .env.example lists VITE_GEMINI_API_KEY; README contains install and run instructions
  - `rule` TR-9.2: When weather API fetch fails, a styled error card is shown to user reading "We couldn't load weather data. Check your connection or try Demo Mode." (no undefined/raw stacktrace)
  - `rule` TR-9.3: `npm run build` compiles without TypeScript errors or unused variable warnings

## Task 10: Main App orchestration, page layout, and runbook test
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 1-9
- **Description**:
  - `App.tsx`: Glue together map, input panel, results, chat; manage analysis state machine (idle → loading → success → error)
  - `App.tsx`: On Analyze click → fetch data → run Risk Engine → get explanation → render; on Try Demo → set demo=true → skip API, use mock → run engine → fallback explanation
  - Main layout: header with app title "SkyGuard Outdoor Safety Analyzer" + tagline; grid layout (map on top/left on desktop, stacked on mobile)
  - `main.tsx`: StrictMode + routerless single page
  - Developer performs full runthrough: Select location → Date → Activity → Analyze → Verify dashboard → Ask follow-up → Screenshot evidence for completed tasks
- **Acceptance Criteria Addressed**: AC-1 through AC-12
- **Test Requirements**:
  - `rule` TR-10.1: Full flow in Demo Mode (no API keys) succeeds end-to-end with no console errors; all dashboard sections populated
  - `rule` TR-10.2: `npm run build` succeeds (zero TS errors, zero fatal Vite warnings)
  - `rubric` TR-10.3: App layout professional and polished; scale 1-5; anchors 1=messy/styled broken, 3=usable layout, 5=cohesive hackathon-quality dark space theme with glass/gradient accents; threshold >= 4

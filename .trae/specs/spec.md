# SkyGuard - Outdoor Safety Analyzer - Product Requirements Document

## Overview
- **Summary**: An AI-powered outdoor activity safety and weather risk assessment web application inspired by NASA Space Apps Challenge projects. Users can select any location on Earth, pick a date and activity, and receive a deterministic risk assessment, safe time windows, and AI-powered explanations.
- **Purpose**: To help outdoor enthusiasts make safe decisions by combining NASA/Earth observation data, a transparent deterministic Risk Engine, and AI-powered personalized explanations.
- **Target Users**: Hikers, campers, cyclists, photographers, travelers, and anyone planning outdoor activities who needs weather-based safety guidance.

## Goals
- Provide accurate, data-driven weather risk assessment for any location on Earth
- Deliver a modern, NASA-inspired dark-themed UI suitable for a hackathon project
- Implement a transparent three-layer architecture (Science → Computation → AI)
- Ensure the app works even without API keys via a Demo Mode with realistic mock data
- Support follow-up Q&A with an AI chat assistant grounded in pre-calculated risk data

## Non-Goals
- Real-time tracking or emergency alert system
- Multi-user accounts or saved preferences
- Mobile-native app (web-only, responsive design)
- Integration with paid APIs (Google Maps, paid weather services)
- Long-term weather trend analysis beyond 7-day forecasts

## Background & Context
This project is inspired by NASA Space Apps Challenge projects like SkySense. The core architectural principle is strict separation: raw NASA/weather data → deterministic Risk Engine (explicit rules only) → Gemini AI (explanation only, no recalculation). The interface must clearly communicate this separation to users.

## Functional Requirements
- **FR-1**: Interactive full-screen/large map with Leaflet + OpenStreetMap; user can pan, zoom, click anywhere to select a location; marker shown; lat/lon displayed; optional place search
- **FR-2**: Date picker for selecting analysis date (today up to forecast horizon)
- **FR-3**: Activity selector dropdown with: Hiking, Camping, Fishing, Cycling, Beach activity, Photography, Traveling, Other
- **FR-4**: "Analyze Conditions" button that triggers the full analysis flow
- **FR-5**: Weather/environmental data fetch from Open-Meteo (primary) and NASA POWER (where appropriate); includes: temperature, precipitation probability/amount, wind speed/gusts, humidity, visibility, weather code, UV/solar data
- **FR-6**: Deterministic Risk Engine with configurable thresholds; calculates Heat, Cold, Rain, Wind, Visibility, UV risks and overall risk score; returns structured JSON
- **FR-7**: Per-hour time-window analysis for the selected day (6+ time slots); risk for each slot calculated; safest window identified by Risk Engine
- **FR-8**: Gemini AI integration: explains risk results, summarizes conditions, personalizes for activity, recommends best windows; receives only structured Risk Engine output; never invents values
- **FR-9**: AI chat panel for follow-up questions; answers grounded in existing risk data only; no new API calls for weather
- **FR-10**: UI sections: Current Conditions cards, Risk Assessment (with visual indicators), Safest Time Window (with timeline visualization), AI Explanation panel, Recommendations list, Data Transparency section (Science→Computation→AI diagram)
- **FR-11**: Demo Mode ("Try Demo" button) using realistic mock data for Tabriz, Iran; complete workflow works without any API keys
- **FR-12**: Fallback explanation generator (clearly labeled, not Gemini) if Gemini API fails or no key
- **FR-13**: Error handling for invalid coords, API failures, missing data, invalid dates, network errors; user-friendly messages; never shows undefined/null

## Non-Functional Requirements
- **NFR-1**: Modern dark space-inspired UI with clean cards, subtle gradients, glassmorphism, modern typography, responsive for mobile/tablet/desktop
- **NFR-2**: Code structure: React + Vite + TypeScript + Tailwind; src/ with components/, services/, api/, utils/, risk/, hooks/, types/
- **NFR-3**: Risk Engine independently testable (pure function, thresholds in central config file)
- **NFR-4**: API keys via .env; .env.example provided; Gemini call structured so it can later move to a backend
- **NFR-5**: No copyrighted branding (NASA, SkySense names/logos not copied)
- **NFR-6**: All three layers (Science, Computation, AI) visibly communicated in the UI

## Constraints
- **Technical**: React, Vite, TypeScript, Tailwind CSS, Leaflet + OpenStreetMap (no paid maps), Gemini API, Open-Meteo, NASA POWER; no paid APIs
- **Business**: Demo Mode must work without any API keys; no exposed API keys in frontend code beyond env vars
- **Dependencies**: Node.js compatible; npm packages must be actively maintained

## Assumptions
- Open-Meteo free tier is sufficient for the use case (no API key required)
- NASA POWER API is free and usable for supplementary solar/climate data
- Gemini API key provided by user via .env
- Forecast horizon: up to 7 days from today; dates beyond that gracefully handled

## Acceptance Criteria

### AC-1: Interactive map selection works
- **Type**: `rule`
- **Given**: App loaded with default view
- **When**: User clicks anywhere on the map
- **Then**: A marker appears at click location; latitude/longitude are displayed in the input panel and passed to weather APIs upon analysis
- **Pass Condition**: Clicking map updates lat/lon state; marker renders; values are not null/undefined
- **Evidence**: Visual confirmation in browser + React DevTools state inspection

### AC-2: Weather data fetched correctly
- **Type**: `rule`
- **Given**: Valid lat/lon and date selected
- **When**: User clicks "Analyze Conditions"
- **Then**: Weather data is retrieved from Open-Meteo (and NASA POWER where used) and displayed in Current Conditions section; fields include temp, rain prob, wind, humidity at minimum
- **Pass Condition**: API call succeeds; structured weather data object has all required fields; no undefined values rendered
- **Evidence**: Network tab shows successful API requests; UI displays numerical values

### AC-3: Risk Engine produces valid structured output
- **Type**: `rule`
- **Given**: Weather data object with required fields
- **When**: Risk Engine processes weather data
- **Then**: Returns JSON with overallRisk (LOW/MEDIUM/HIGH), score (0-100), per-factor risks (temp, rain, wind, etc.), and recommendedWindows array with start/end/risk
- **Pass Condition**: Output structure matches schema; all risk levels in allowed set; score is integer 0-100
- **Evidence**: Console.log of engine output + Risk Engine unit-style sanity check

### AC-4: Safest time window chosen by Risk Engine (not Gemini)
- **Type**: `rule`
- **Given**: Multiple hourly time slots with per-slot risk scores
- **When**: Risk Engine analyzes the day
- **Then**: The window with lowest risk score (and reasonable length) is selected as recommended; Gemini receives this as read-only data
- **Pass Condition**: recommendedWindows in engine output has lowest aggregate risk score among possible 3-hour windows
- **Evidence**: Compare recommended window risk score against all other possible windows in a log dump

### AC-5: Gemini explains results without inventing data
- **Type**: `rule`
- **Given**: Risk Engine output JSON passed to Gemini
- **When**: Gemini responds
- **Then**: Gemini explanation references only values present in the Risk Engine JSON; no weather values invented; no risk levels changed
- **Pass Condition**: Manual review of Gemini response text against engine JSON for a given run
- **Evidence**: Side-by-side screenshot of engine output and AI explanation panel

### AC-6: AI chat assistant answers follow-ups grounded in existing data
- **Type**: `rule`
- **Given**: Risk analysis complete and chat panel available
- **When**: User asks "Why is 3 PM risky?" or similar
- **Then**: Answer is derived from existing Risk Engine results; no new weather API call is made; no invented values
- **Pass Condition**: Network tab shows no new weather requests; chat response references stored risk data
- **Evidence**: Network tab + chat screenshot

### AC-7: Demo Mode works end-to-end without API keys
- **Type**: `rule`
- **Given**: No GEMINI_API_KEY in env and user clicks "Try Demo"
- **When**: Analysis runs
- **Then**: Mock weather data flows → Risk Engine calculates → Safe window identified → Fallback explanation displayed (clearly labeled)
- **Pass Condition**: All UI sections populate; no errors; fallback explanation says "Generated from structured results" not "Gemini"
- **Evidence**: Full runthrough screenshot with demo flag active

### AC-8: Responsive UI layout
- **Type**: `rubric`
- **Dimension**: Mobile/tablet/desktop layout fidelity
- **Scale**: 1-5
- **Anchors**: 1 = broken on mobile, horizontal scroll, overlapping text; 3 = usable but cramped on small screens; 5 = looks polished at 375px, 768px, 1200px with no overflow or layout breakage
- **Pass Threshold**: >= 4
- **Evidence**: Browser DevTools device mode screenshots at three breakpoints

### AC-9: NASA-inspired UI aesthetics
- **Type**: `rubric`
- **Dimension**: Hackathon-quality visual design
- **Scale**: 1-5
- **Anchors**: 1 = default unstyled HTML; 3 = basic dark theme with some cards; 5 = professional dark space theme with gradients, glass cards, risk color indicators, clear typography hierarchy, map integrated nicely
- **Pass Threshold**: >= 4
- **Evidence**: Full-page screenshots of main dashboard after analysis

### AC-10: Data transparency section clearly shows 3 layers
- **Type**: `rule`
- **Given**: Main dashboard rendered
- **When**: User scrolls to "How was this calculated?" section
- **Then**: Three layers visible: Science (NASA/Weather Data) → Computation (Risk Engine) → AI (Gemini explanation); each with label and arrow; explicitly states AI does NOT calculate risk
- **Pass Condition**: Visual section exists with all 3 layers named and correct arrow order
- **Evidence**: Screenshot of the section

### AC-11: Error handling — no undefined/null in UI
- **Type**: `rule`
- **Given**: Any error scenario (bad coords, API fail, bad date, no network)
- **When**: Error occurs
- **Then**: Friendly message shown; no "undefined", "NaN", or blank values in displayed cards
- **Pass Condition**: Simulated error scenarios show styled error messages, never raw undefined
- **Evidence**: Screenshot of at least one error state

### AC-12: Environment file example and README
- **Type**: `rule`
- **Given**: Project root
- **When**: Checking for onboarding docs
- **Then**: .env.example exists with required vars; README has setup instructions
- **Pass Condition**: Both files exist; .env.example lists GEMINI_API_KEY at minimum; README includes install + run steps
- **Evidence**: File listing + file content spot check

# SafeCampus (Raksha Path) — API & Integration Notes

This document provides technical integration notes for external APIs, webhooks, and the AI classification pipeline.

---

## 1. Google Gemini AI Incident Classifier

### Overview
SafeCampus uses the Google Gemini API (model `gemini-1.5-flash` or `gemini-2.0-flash`) to analyze unstructured student complaints, categorize them into standardized incident types, score urgency ($1\text{ to }5$), detect duplicates within 250m, and recommend responsible university departments.

### API Endpoint & Request Format
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Analyze the incident: 'Broken sodium light near Gate 3 turn. Pitch black after 8 PM, groups loitering.'..."
        }
      ]
    }
  ],
  "generationConfig": {
    "response_mime_type": "application/json",
    "temperature": 0.2
  }
}
```

### JSON Response Schema
```json
{
  "category": "broken_lighting",
  "urgency": 4,
  "summary": "Urgent: Inactive sodium streetlight creating blind darkness near Gate 3.",
  "assigned_department": "Electrical Maintenance Dept",
  "recommended_action": "Deploy high-lumen solar floodlight within 24 hours.",
  "rationale": "High urgency due to darkness combined with loitering reports along outer perimeter."
}
```

### Fallback Heuristic Classifier
If `VITE_GEMINI_API_KEY` is omitted or network connectivity is unavailable, the built-in regex/NLP keyword classifier (`ruleBasedClassifier`) activates seamlessly with 0 latency, guaranteeing that demo evaluation and offline usage never break.

---

## 2. Telegram Bot API (Emergency Dispatch)

### Overview
The Telegram Bot API serves as the primary real-time channel to alert campus security desks, proctors, and night patrol teams.

### Dispatch Request
- **Endpoint**: `https://api.telegram.org/bot{BOT_TOKEN}/sendMessage`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`

```json
{
  "chat_id": "{SECURITY_CONTROL_ROOM_CHAT_ID}",
  "text": "🚨 [SAFECAMPUS - SILENT SOS TRIGGERED] 🚨\nTime: 11:42 PM\nUser: Ananya Sharma\nTrigger: Accelerometer Shake Detection\nLocation: Girls Hostel Perimeter Lane (28.5480, 77.1905)\nLive Map: https://maps.google.com/?q=28.5480,77.1905\nStatus: High Priority Alert Dispatched to 3 Nearby Safety Buddies.",
  "parse_mode": "HTML"
}
```

---

## 3. Twilio SMS Stub

When configured with `VITE_TWILIO_ACCOUNT_SID` and `VITE_TWILIO_AUTH_TOKEN`, SMS dispatch sends automated alerts to primary family and hostel warden phone numbers:

```
[SAFECAMPUS ALERT] Emergency SOS triggered by Ananya Sharma at Girls Hostel Lane. Live GPS: https://maps.google.com/?q=28.5480,77.1905
```

In Demo Mode, SMS dispatch is logged to the client console and displayed in the **Simulated SOS Broadcast Modal** without incurring external cellular toll charges.

---

## 4. 3D Vector Basemap & MapLibre GL JS

### Overview
SafeCampus uses **MapLibre GL JS (v4)** for hardware-accelerated 3D WebGL rendering, 3D building extrusions, vector tile clustering, and smooth camera flight paths.

### Basemap Sources & Priority
1. **Primary (Free, No Key Required)**:
   - **OpenFreeMap Liberty Style**: `https://tiles.openfreemap.org/styles/liberty`
   - Configured via `VITE_MAP_STYLE_URL`.
   - Vector building layer: `source-layer: "building"`, extruded dynamically via MapLibre `fill-extrusion` with `fill-extrusion-height` bound to `render_height` / `height` properties (default $10\text{m}$).
2. **Alternative Vector Basemap (Optional Key)**:
   - **MapTiler 3D Style**: `https://api.maptiler.com/maps/streets-v2/style.json?key={VITE_MAPTILER_KEY}`
3. **Resilient 2D Raster Fallback**:
   - Standard OpenStreetMap raster tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`).
   - Automatically loaded if WebGL or vector style JSON fails to download or render.

### Web Worker Configuration (Vite & Safari)
MapLibre GL JS (v6+) uses a standalone ES module Web Worker (`maplibre-gl-worker.mjs`). In Vite environments, unconfigured workers trigger a 404 under `/node_modules/.vite/deps/` because the pre-bundler does not automatically package sibling module workers.

To resolve this across modern browsers—especially **Safari/WebKit** with strict CORS/MIME worker validation:
- **Explicit Worker URL**: Imported using Vite's `?worker&url` query parameter and registered via `maplibregl.setWorkerUrl(maplibreWorkerUrl)` before map instantiation.
- **Dependency Optimization**: `optimizeDeps.include: ['maplibre-gl']` declared in `vite.config.ts` ensures proper ESM chunk pre-bundling.
- **Responsive Resizing**: Connected `ResizeObserver` calling `map.resize()` ensures the WebGL canvas dimensions never collapse during tab or container layout changes.

### Mobile & Device Concurrency Adaptation
- Auto-detects device hardware threads: `navigator.hardwareConcurrency <= 4` defaults to 2D view (`pitch: 0`) to preserve battery and frame rate on low-tier mobile devices.
- High-spec devices launch directly into 3D isometric perspective (`pitch: 58°, bearing: -20°`).
- Accessible camera flight respects `prefers-reduced-motion` media queries.

---

## 5. Nominatim Geocoding API (Campus Search)

### Overview
Allows students and campus administrators to search for any university or college worldwide by name and jump directly to its coordinates.

- **Endpoint**: `https://nominatim.openstreetmap.org/search`
- **Method**: `GET`
- **Query Parameters**:
  - `q`: University search query (e.g. `IIT Delhi`, `Delhi University`)
  - `format`: `json`
  - `limit`: `5`
  - `addressdetails`: `1`
- **User-Agent Requirement**: Includes custom header `User-Agent: SafeCampus-RakshaPath/2.0` in accordance with OpenStreetMap Foundation acceptable use policy.

---

## 6. Overpass API (Campus Feature & Graph Import)

### Overview
Extracts detailed campus boundaries, building footprints, lit street lamps, security checkpoints, and pedestrian walkways directly from OpenStreetMap data.

- **Endpoint**: `https://overpass-api.de/api/interpreter`
- **Method**: `POST`
- **Query Body** (QL):
```overpassql
[out:json][timeout:25];
(
  way["highway"~"footway|path|pedestrian|steps"](around:800, 28.5450, 77.1926);
  node["highway"="street_lamp"](around:800, 28.5450, 77.1926);
  node["amenity"="police"](around:800, 28.5450, 77.1926);
  way["building"](around:800, 28.5450, 77.1926);
);
out body;
>;
out skel qt;
```
- **Caching**: Results are cached in Supabase `campus_graphs` (or `localStorage` fallback) so queries are never repeated unnecessarily.


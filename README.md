# SafeCampus (Raksha Path) 🛡️

> **A Next-Generation 3D Campus Safety & Issue-Resolution Progressive Web App**  
> *Developed for the National Women-in-Tech Hackathon — Student Innovation Track*

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![MapLibre GL JS](https://img.shields.io/badge/MapLibre%20GL%20JS-3D%20Vector-3388ff.svg)](https://maplibre.org/)
[![OpenFreeMap](https://img.shields.io/badge/Basemap-OpenFreeMap%20Liberty-green.svg)](https://openfreemap.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E.svg)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-orange.svg)](https://deepmind.google/technologies/gemini/)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple.svg)](https://web.dev/progressive-web-apps/)

---

## 📌 Problem Statement

College campuses should be sanctuaries of learning and empowerment. However, students—especially female hostellers—frequently face critical safety concerns after sunset:
1. **Unlit or Dangerous Shortcuts**: Lack of visibility along peripheral paths, broken sodium lights, and unpatrolled boundary walls.
2. **Delayed Emergency Response**: During harassment, ragging, or sudden distress, dialing numbers or opening bulky emergency apps is often dangerous or unfeasible.
3. **Unresolved Infrastructure Hazards**: Complaints about broken streetlights, broken boundary fences, or CCTV blindspots languish in physical registers without accountability.

**SafeCampus (Raksha Path)** solves this by closing the complete loop:
$$\textbf{PREVENT (3D Safe Routes \& Heatmap)} \longrightarrow \textbf{RESPOND (Silent Multi-Trigger SOS)} \longrightarrow \textbf{RESOLVE (Anonymous AI Reporting \& Admin Hub)}$$

---

## ✨ Core Features by Pillar

### 1. 🛡️ PREVENT: 3D Map, Safe Route Navigator & Campus Fly-In
- **3D MapLibre GL Vector Engine**: Powered by OpenFreeMap Liberty vector tiles with zero paid API keys required.
- **3D Building Extrusions (`fill-extrusion`)**: Real-time rendering of campus building heights (`render_height` / `height`). Hostels and dormitories are visually distinguished in vibrant rose/magenta (`#be185d`), while academic blocks appear in deep indigo.
- **2D / 3D Toggle**: Persisted choice between 2D top-down view (pitch 0) and 3D perspective (pitch 58, bearing -20). Automatically selects 2D on low-end hardware (`navigator.hardwareConcurrency <= 4`) or WebGL-restricted devices.
- **Auto Campus Map Pipeline & Cinematic Fly-In**:
  - Search any university via **Nominatim OSM Geocoding** or choose preloaded campuses (IIT Delhi, DU North Campus, BITS Pilani, IIT Bombay).
  - Fetches OSM campus pathways via **Overpass API** with Supabase / local storage caching.
  - Triggers a cinematic camera fly-in with 60° pitch and smooth 3-second bearing rotation upon selection.
- **Fastest vs. Safest Pathfinding in 3D**:
  - *Fastest Route*: Shorter geometrically, but traverses unpatrolled dark shortcuts ($55/100$ safety index).
  - *Safest Route*: Illuminated green corridor with soft aura glow routing along patrolled boulevards and guard posts ($96/100$ safety index).
- **3D Camera Route Preview Flight**: Click "Preview in 3D Flight" to smoothly glide the camera along the selected route at pitch 65 over 10 seconds.
- **Night Illumination Mode**: Darkens building extrusions into midnight plum, activates glowing solar street lamps, and intensifies hazard alerts.
- **"Walk With Me" Companion**: Live countdown ETA timer, automated check-in prompts, and instant deviation alerts if $>50\text{m}$ off course.

### 2. 🚨 RESPOND: Stealth Multi-Trigger Silent SOS
- **Hold-to-Activate SOS Button**: Large circular panic button with progressive 2-second hold ring to prevent accidental false alarms.
- **5 Alternate Stealth Triggers**:
  1. *Sudden Phone Shake*: Detected via `DeviceMotionEvent` accelerometer.
  2. *3x Rapid Power/Volume Button Sim*: Simulates rapid clicks without screen activation.
  3. *Emergency Codeword*: Triggered by speaking or entering `"RAKSHA"` or `"RED"`.
  4. *Calculator Disguise*: Functional fake calculator screen with secret exit (`1234=`) or distress alert (`911=`).
  5. *Route Deviation*: Automated trigger if student strays off course.
- **Multi-Channel Dispatch**: Broadcasts live coordinates, 5-second ambient audio clip status, and alert payload to:
  - Campus Security Control Room via **Telegram Bot API**.
  - 3 Primary Emergency Contacts via **Twilio SMS Stub**.
  - Opted-in verified **Safety Buddies** within 250m.

### 3. 🛠️ FIX: Anonymous AI Issue Resolution & Admin Analytics
- **Confidential Reporting**: Anonymous reporting toggle is **ON by default**, stripping all student identity markers.
- **Gemini AI Classification Engine**:
  - Automatically classifies incident categories (`broken_lighting`, `harassment`, `cctv_blindspot`, `ragging_concern`, `hostel_mess_water`, etc.).
  - Scores urgency ($1\text{ to }5$).
  - Detects duplicate hazards within 250m.
  - Generates crisp 1-line executive summaries.
  - Automatically routes tickets to responsible campus departments.
  - *Zero-crash guarantee*: Includes an offline rule-based NLP fallback if the API key is unconfigured.
- **Lifecycle Report Tracker**: Transparent 4-step progress: `Submitted ➔ Assigned ➔ In Progress ➔ Resolved`.
- **Administrative Intelligence Dashboard**:
  - Recharts visual analytics (Category breakdown, Open vs. Resolved ratio).
  - Top 5 Hotspots ranking table.
  - AI Preventive Remediation Action Cards (e.g. *"Install 4 solar lights at Gate 3 Turn: 14 night reports"*).
  - Integrated **3D Hotspot Map** tab directly in the administrative command view.
  - Ticket dispatcher: Assign wardens, security staff, or ICC panels with status updates.

---

## 📸 Screenshots & Interface Placeholders

| 3D Campus Buildings & Extrusions | 3D Route Flight Preview |
| :---: | :---: |
| *[Screenshot: MapLibre GL 3D Extruded Campus Buildings with Hostels in Rose]* | *[Screenshot: Camera Flight Preview along Safest Green Corridor at Pitch 65]* |

| Silent SOS & Stealth Triggers | Admin Command Dashboard & 3D Map |
| :---: | :---: |
| *[Screenshot: Circular SOS Button with Hold Ring & Multi-Triggers]* | *[Screenshot: Recharts Analytics & Embedded 3D Hotspot Map]* |

| Fake Calculator Disguise | Auto Campus Map Explorer |
| :---: | :---: |
| *[Screenshot: Stealth Calculator Screen hiding the app]* | *[Screenshot: Nominatim Search & Cinematic Campus Fly-In]* |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, TypeScript 5.7, Tailwind CSS 3.4, Lucide React Icons.
- **3D Mapping**: **MapLibre GL JS 4.7**, OpenFreeMap vector basemaps (`styles/liberty`), GPU-accelerated `fill-extrusion` 3D building layers.
- **Fallback Map**: OpenStreetMap 2D raster tile style (auto-activated if vector tiles are unreachable or WebGL is disabled).
- **Auto Campus Pipeline**: OpenStreetMap Nominatim Search API, Overpass API, and campus graph caching.
- **Charts**: Recharts 2.15.
- **PWA Capabilities**: Service Worker (`sw.js`), Web App Manifest (`manifest.json`), Offline Cache, Installable standalone mobile container.
- **AI Triage**: Google Gemini API (`gemini-1.5-flash`) with heuristic keyword NLP fallback.
- **Emergency Gateways**: Telegram Bot API, Twilio SMS stub, simulated broadcast UI.
- **Backend / Database**: Supabase PostgreSQL 15, Row Level Security (RLS) policies, Realtime pub/sub, with dual-mode offline LocalStorage fallback.

---

## 🚀 Quick Setup & Installation

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node `v26.8.2`)
- npm `v9+` or `v11+`

### 1. Clone & Install
```bash
git clone <repo-url>
cd safecampus-raksha-path
npm install
```

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

```env
# MapLibre 3D Vector Style (OpenFreeMap default; fallback to 2D raster OSM on failure)
VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
VITE_MAPTILER_KEY=

# Optional: Supabase Credentials (app works 100% out-of-the-box in demo mode if unconfigured)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Google Gemini API Key (falls back to local NLP classifier if not provided)
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Telegram Emergency Dispatch
VITE_TELEGRAM_BOT_TOKEN=your-telegram-bot-token
VITE_TELEGRAM_CHAT_ID=your-telegram-chat-id

# Demo Settings
VITE_ENABLE_DEMO_MODE=true
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your mobile browser or desktop device.

### 4. Build Production Bundle
```bash
npm run build
npm run preview
```

---

## 🧪 Hackathon Demo-Mode Guide

SafeCampus is built with a zero-failure hackathon architecture:
- **Instant Hydration**: Over 60 realistic incidents, security checkpoints, and safety buddies are seeded out-of-the-box.
- **3D Fly-In Demonstration**: Tap the **Campus button** in the header to search any university or fly into IIT Delhi, BITS Pilani, or DU North Campus with cinematic 3D easing.
- **Route Preview in 3D**: Select the Safest Route in the Walk tab and tap **Preview in 3D Flight** to glide the camera across the path.
- **Reset Data**: Click the **Reset Data** button in the top banner to restore the initial 60 records at any time.
- **Night Simulation**: Toggle the **Moon icon** in the top navigation to illuminate streetlamps, darken 3D buildings, and simulate night risk conditions.
- **Role Switch**: Click **Student / Admin View** in the top navigation to transition between the student reporting interface and the university administrative command dashboard.

See [demo-script.md](file:///Users/kashish3359/.gemini/antigravity/scratch/safecampus-raksha-path/demo-script.md) for a complete 2-3 minute presentation script.

---

## 🔒 Privacy by Design

- **Zero-Knowledge Anonymity**: Reports strip IP addresses and student identity logs.
- **Ephemeral Telemetry**: Real-time GPS coordinates captured during "Walk With Me" or SOS events are auto-purged after 24 hours.
- **No Background Tracking**: The app never queries GPS without explicit user action.
- **Fuzzed Peer Proximity**: Peer Safety Buddies see approximate radius circles ($\sim 200\text{m}$) rather than pinpoints until an alert is formally accepted.
- Detailed in the visible **Privacy and Consent Screen** accessible via the shield icon in the header.

---

## 📄 License & Acknowledgements

Created with ❤️ for women in tech innovation and safer educational communities everywhere.
Licensed under the [MIT License](LICENSE).

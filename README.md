# Orienteering: Digital AR Scavenger Hunt

A full-stack web app for GPS-powered outdoor scavenger hunts used in physical education classes. Teachers create sessions with map checkpoints; students navigate to them via GPS and complete AI-generated tasks.

---

## Prompts Used to Build This Project

### Prompt 1 — Initial Build
> "Build a full-stack web app for a Digital AR Scavenger Hunt used in physical education classes."

**Spec included:**
- Teacher Dashboard: create sessions, place GPS checkpoints on a Leaflet map, QR join codes, live team monitoring
- Student View: GPS navigation, AI-generated tasks per checkpoint, hint system, score submission
- AI task/hint/debrief report generation via Claude API (`claude-sonnet-4-20250514`)
- SQLite database, Node.js + Express backend, React + Vite frontend
- React Router v6, Tailwind CSS

---

### Prompt 2 — Rename + Cyberpunk Theme + Mobile + Place Search
> "This is the project name, Orienteering: Digital AR Scavenger Hunt. Please change to this main name. And use cyberpunk theme that would be very engaging to everyone. Make the student view fully mobile-optimized with large touch targets. Also add in Teacher Dashboard the option for searching the place checkpoints."

**Changes made:**
- Renamed project to "Orienteering: Digital AR Scavenger Hunt"
- Applied full cyberpunk theme: dark `#06060f` background, neon cyan/pink/green/yellow/purple accents, Orbitron + Share Tech Mono fonts, scanlines, neon glow effects
- Custom Tailwind `cyber.*` color palette with `extend.colors`
- Student view buttons set to `h-14`/`h-16` for large touch targets
- Added Nominatim (OpenStreetMap) place search with debounced 450ms fetch, floating over the teacher map

---

### Prompt 3 — Fix Search Placement + Map Tiles + Remove Emojis
> "Searching location and setting that location is not working properly — in Teacher section if I search the place, that place needs to be set as a checkpoint. And in maps please mention the place names in white color so that would be easy to see, or change to a different theme that is easy to point out everything. And don't use any emojis in this project."

**Changes made:**
- Fixed `selectSuggestion()` in MapPicker to set both `flyTarget` AND `pending` (opening the checkpoint popup at the searched location) AND pre-filling label
- Switched map tiles from dark CartoDB Dark Matter to **CartoDB Voyager** — clean, readable labels on a neutral background
- Removed all emojis project-wide (11 files): replaced with compact text badges (PHY, COG, RPT, GO, etc.)

---

### Prompt 4 — Teacher Session Rejoin
> "Or add if the Teacher creates the session and unfortunately she left, so she won't be able to see the results. Please add this to rejoin the section for Teacher for seeing the progress and all."

**Changes made:**
- `localStorage` key `orienteering_teacher_sessions` stores up to 10 recent sessions
- Step 0 redesigned as two side-by-side panels: "New Mission" + "Rejoin Session"
- "Recent Sessions" list below with code badge, session name, timestamp, open/remove actions
- `handleRejoin(e)`: looks up session by join code → navigates to `/teacher/session/:id`
- `handleRejoinSaved(saved)`: verifies session exists → navigates, or removes stale entry
- Sessions auto-saved when created via `handleCreateSession`

---

### Prompt 5 — Student Session Rejoin
> "Same like teacher also add the rejoin feature to students."

**Changes made:**
- `localStorage` key `orienteering_student_session` stores team, session, checkpoints, currentCpId
- JOIN phase shows a purple "Resume Mission" card when saved session exists: squad name, session name, code, waypoint progress
- "Continue Mission" button restores full state (team, session, checkpoints, currentCp) and restarts GPS
- "Start a new mission instead" link clears saved data
- State saved after joining, updated after each checkpoint advance
- Cleared when "Return to Base" is clicked on the FINISHED screen

---

### Prompt 6 — Remove All Text Badges + Update DEMO01 Coordinates
> "Please remove all text badges that look weird. Also for DEMO01 these are 4 checkpoints, please use this points for DEMO01:
> 49.25460216243028, 7.04048242414636
> 49.254741508117874, 7.042547725066189
> 49.25732386273906, 7.0428852731889755
> 49.2554150857629, 7.041457937927682"

**Changes made:**
- Replaced all text badge boxes with inline SVG icons:
  - `AR` → crosshair/target SVG (Home logo)
  - `CMD` → terminal `>_` SVG (Commander card)
  - `OPR` → person figure SVG (Operative card)
  - `GO` → compass needle SVG (Student join screen)
  - `OK` / `WIN` → checkmark SVG (submit result, finished screen, monitor)
  - `RPT` → bar chart SVG (report header)
  - `NEW` / `BACK` / `LIVE` → plus, loop, signal-waves SVGs (Teacher dashboard)
  - `PHY/COG/SOC/CRE` tag boxes → small colored dot in TaskCard; full label text in SessionMonitor
- Updated `server/seed.js` DEMO01 to 4 checkpoints using the provided coordinates (Saarbrücken area, Germany), removed the 5th Central Park checkpoint

---

### Prompt 7 — Mobile Network Access Fix
> "What is the network link to check in mobile phone?"
> *(followed by)* "It's not loading in mobile, everything running."

**Fix:** Added `host: true` to `client/vite.config.js` so Vite listens on `0.0.0.0` instead of localhost-only, making it accessible from other devices on the same Wi-Fi.

```js
server: {
  host: true,
  port: 5173,
  ...
}
```

Access on mobile: `http://192.168.2.107:5173`

---

### Prompt 8 — Student Results / Standings View
> "Add the option to see their result for students."

**Changes made:**
- Added "Scores" button in MAP phase header and TASK phase header
- Added "View Standings" button on FINISHED screen
- Full-screen standings overlay showing:
  - Own squad card (highlighted in cyan) with score, waypoints cleared, per-waypoint progress bar
  - Full leaderboard of all squads sorted by score, own team marked "(you)"
  - Loading spinner while fetching from `GET /api/sessions/id/:id`
- Data refreshed from server on every open

---

### Prompt 9 — Fix Standings Buttons Spacing
> "Please fix the View Standings and Return to Base buttons, because they stick together."

**Fix:** Wrapped both buttons in a `flex flex-col items-center gap-3` container with consistent `w-64` width.

---

### Prompt 10 — Remove Emoji from Page Title (Favicon)
> "Change the emoji from page title. Don't use any emoji."

**Fix:** Replaced the 🎯 emoji favicon in `client/index.html` with an inline SVG crosshair icon in cyber-cyan (`#00e5ff`).

---

### Prompt 11 — Fix Teacher Map: Move Search Inside Panel
> "In teacher section searching places and setting up that is still not working properly and the places are not in visible color. Add that search section inside the left panel."

**Changes made:**
- Moved search input and suggestions list from floating overlay on the map into the left sidebar panel
- Search renders inside the `<aside>` with solid `cyber-darker` background, proper border and z-index
- Suggestions dropdown anchored below the input with `z-30`
- Selecting a result passes `{ lat, lng, label, _key: Date.now() }` to MapPicker via `selectedLocation` prop
- MapPicker's `useEffect` watches `_key` to reliably trigger pending popup + map fly on every selection

---

### Prompt 12 — Replace Search with GPS Location
> "This is not feasible. Please add the option in teacher section to use the current locations and add near the locations. Remove the search option."

**Changes made:**
- Removed all search state and UI from TeacherDashboard and MapPicker entirely
- Added **"Use My Location"** button in the left panel with a GPS crosshair icon and loading spinner
- Calls `navigator.geolocation.getCurrentPosition()` — flies the map to teacher's current position
- Teacher then clicks anywhere on the map (near their position) to place checkpoints
- Shows error message if browser location permission is denied

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3, React Router v6 |
| Maps | Leaflet, react-leaflet, CartoDB Voyager tiles |
| QR Codes | qrcode.react (`QRCodeSVG`) |
| Backend | Node.js, Express |
| Database | Node.js built-in `node:sqlite` (`DatabaseSync`) — no native compilation needed |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Fonts | Orbitron, Share Tech Mono (Google Fonts) |

---

## How to Run

```bash
# Install all dependencies
npm run install:all

# Seed demo data (DEMO01 session with 4 checkpoints)
npm run seed

# Start both server and client
npm run dev
```

- Server runs on port **3000**
- Client runs on port **5173**
- Access from phone (same Wi-Fi): `http://<your-local-ip>:5173`

Copy `.env.example` to `.env` and add your `ANTHROPIC_API_KEY` for AI features. The app works without it using static fallback tasks/hints.

---

## Key Architecture Decisions

- **`node:sqlite` instead of `better-sqlite3`**: Avoids Windows Build Tools / node-gyp compilation failures. Available unflagged since Node 23.4+. Run with `--no-warnings` flag to suppress the experimental warning.
- **Tailwind `@apply` limitation**: Custom color names (`bg-cyber-card` etc.) cannot be used inside `@layer components`. All `index.css` utilities use direct hex values; `@apply` is only used for structural Tailwind classes (`rounded-xl`, `transition-all`, etc.).
- **GPS unlock threshold**: 20 metres (`UNLOCK_DISTANCE` in `utils.js`). A "Demo: unlock without GPS" link is shown when no GPS position is available.
- **Score formula**: `Math.max(40, 100 - hintsUsed * 15)` — using hints reduces score but a minimum of 40 is guaranteed.
- **Difficulty adaptation**: AI adapts task difficulty per team based on average completion time (< 120s → bump to hard; > 360s → drop to easy).

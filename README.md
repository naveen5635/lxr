# Orienteering: Digital AR Scavenger Hunt

A full-stack web app for GPS-powered outdoor scavenger hunts used in physical education classes. Teachers create sessions with map checkpoints; students navigate to them via GPS and complete AI-generated tasks.

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

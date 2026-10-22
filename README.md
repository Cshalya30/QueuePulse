# QueuePulse · Premium IoT Queue Operations & Analytics Platform

**QueuePulse** turns a physical service queue into a measurable, deterministic operational system. By bridging physical **ESP32** counter nodes (**RC522 RFID**, **VL53L0X Time-of-Flight laser presence**, OLED, chimes, and tactile controls) with a dark graphite operations dashboard and real-time cloud telemetry, QueuePulse delivers complete operational visibility, eliminated idle latency, and auditable service metrics.

---

## ⚡ Key Highlights

- **Local-First Edge Authority**: ESP32 runs an autonomous Moore finite state machine locally at each counter. Operations never halt if the network disconnects.
- **Physical Presence Verification**: VL53L0X Time-of-Flight laser sensor measures customer distance (threshold 800mm) to confirm desk clearance before calling the next ticket.
- **RFID Response Verification**: Arriving students tap their 13.56 MHz RFID smartcard (RC522) to authenticate their session and start the service clock.
- **Grace Queue Recovery**: Unresponsive tokens automatically transition to a secondary Grace Queue buffer after a configurable response window (e.g. 60s) without clogging counter throughput.
- **Haulix-Inspired Operations Dashboard**: High-density split-pane counter matrix, floating detail panel, queue pressure timeline, and live activity stream.
- **5-Stage Systems Methodology**: Interactive sensor bench, state-machine diagram, and network disruption resilience walkthrough.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Dark Graphite Design System Tokens
- **Icons & Visuals**: Lucide React + Recharts + Framer Motion
- **Database / Backend**: Supabase (PostgreSQL with RLS & Realtime) + Next.js REST API
- **Embedded Hardware Nodes**: ESP32, RC522 RFID reader, VL53L0X ToF laser sensor, I2C OLED display, piezo buzzer, staff tactile buttons

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 3. Production Build
```bash
npm run build
npm start
```

---

## 🧭 Routes & Architecture

- **Public Landing Page**: `/`
- **Operations Dashboard**: `/app/overview`
- **Live Queue Orchestration**: `/app/queue`
- **Counters & Hardware Nodes**: `/app/counters`
- **Service Performance Analytics**: `/app/analytics`
- **System Activity & Audit Log**: `/app/events`
- **Hardware & SLA Settings**: `/app/settings`
- **5-Stage Systems Methodology**: `/methodology`

---

## 📡 REST API (server-authoritative, Supabase-backed)

All `/api/counters/:id/*` and `/api/telemetry` routes require an `x-device-secret` header matching the hash stored in `devices.secret_hash` (see `scripts/provision-device.mjs`). State transitions are enforced by Postgres functions in `supabase/migrations/0001_atomic_queue_ops.sql`, not by the browser or the ESP32 — a rejected transition (e.g. calling a token on an occupied desk) returns a 4xx with a reason string.

- `GET /api/tokens` — List tokens (optional `?workspaceId=&status=`).
- `POST /api/tokens` — Kiosk/RFID registration; atomically allocates the next sequential token number per category and rejects a duplicate active registration for the same RFID UID.
- `POST /api/counters/:id/call` — Staff NEXT button. Atomically claims the next eligible token (Grace Queue first, then FIFO), rejecting if the desk is occupied or a session is already active.
- `POST /api/counters/:id/rfid` — RFID tap at the counter; verifies against the token's registered UID and starts service.
- `POST /api/counters/:id/done` — Staff DONE button; completes the active IN_SERVICE token.
- `POST /api/counters/:id/missed` — Called by the node after its local 60s RFID response window expires; moves the token to the Grace Queue.
- `POST /api/telemetry` — ToF distance ingestion; applies clearance/occupancy transitions and logs a `counter_telemetry` row.
- `POST /api/events` — Audit log entry (ESP32 edge events require device auth; operator-sourced events do not).

### Environment variables
See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` are server-only and must never be prefixed `NEXT_PUBLIC_`.

### Live Mode vs Demo Mode
The dashboard's Demo/Live switcher (top bar) now does real work: Demo Mode runs the original in-memory hardware simulator untouched; Live Mode reads real Supabase data with Realtime updates and shows a configuration error inline if Supabase env vars are missing.

---

## 📦 Database Schema

Complete PostgreSQL DDL, Row Level Security (RLS) policies, indexes, and seed datasets are located in `supabase/schema.sql`.

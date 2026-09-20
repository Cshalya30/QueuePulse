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

## 📡 REST Ingestion Endpoints (for ESP32)

- `POST /api/telemetry` — Ingests ToF distance (mm), occupancy status, and RSSI signal.
- `POST /api/events` — Records RFID card taps, service completion triggers, and clearance transitions.
- `GET /api/tokens` / `POST /api/tokens` — Kiosk token issuance.

---

## 📦 Database Schema

Complete PostgreSQL DDL, Row Level Security (RLS) policies, indexes, and seed datasets are located in `supabase/schema.sql`.

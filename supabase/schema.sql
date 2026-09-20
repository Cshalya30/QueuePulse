-- ========================================================================
-- QueuePulse: Premium IoT Queue Operations Platform Database Schema
-- Supabase Postgres DDL with Row Level Security (RLS) & Realtime Support
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WORKSPACES
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    timezone VARCHAR(64) DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SERVICE CATEGORIES
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prefix VARCHAR(8) NOT NULL,
    sla_target_seconds INTEGER DEFAULT 900, -- 15 minutes default
    color VARCHAR(32) DEFAULT '#b8ef79',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DEVICES (ESP32 Nodes)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    device_code VARCHAR(64) UNIQUE NOT NULL,
    firmware_version VARCHAR(32) DEFAULT 'v2.4.1-esp32-pulse',
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    online BOOLEAN DEFAULT TRUE,
    wifi_signal INTEGER DEFAULT -55, -- in dBm
    uptime_seconds BIGINT DEFAULT 86400,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COUNTERS
CREATE TABLE IF NOT EXISTS counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    service_category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, MAINTENANCE, OFFLINE
    occupancy_state VARCHAR(32) DEFAULT 'CLEAR', -- CLEAR, OCCUPIED, OBSTRUCTED
    current_distance_mm INTEGER DEFAULT 1200,
    distance_threshold_mm INTEGER DEFAULT 800,
    current_token_id UUID,
    staff_name VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TOKENS
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
    service_category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    token_code VARCHAR(32) NOT NULL,
    status VARCHAR(32) DEFAULT 'WAITING', -- WAITING, CALLED, IN_SERVICE, PENDING_CLEARANCE, COMPLETED, MISSED, GRACE_QUEUE, CANCELLED
    priority VARCHAR(16) DEFAULT 'NORMAL', -- NORMAL, GRACE, VIP
    created_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    service_started_at TIMESTAMPTZ,
    service_completed_at TIMESTAMPTZ,
    missed_at TIMESTAMPTZ,
    moved_to_grace_at TIMESTAMPTZ,
    waiting_seconds INTEGER,
    service_seconds INTEGER,
    rfid_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    is_demo BOOLEAN DEFAULT FALSE
);

-- Circular FK link from counters to tokens
ALTER TABLE counters ADD CONSTRAINT fk_counter_token FOREIGN KEY (current_token_id) REFERENCES tokens(id) ON DELETE SET NULL;

-- 6. OPERATIONAL EVENTS
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
    token_id UUID REFERENCES tokens(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(32) DEFAULT 'ESP32_EDGE', -- ESP32_EDGE, CLOUD_SYNC, OPERATOR_ACTION
    severity VARCHAR(16) DEFAULT 'info', -- info, success, warning, critical
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_demo BOOLEAN DEFAULT FALSE
);

-- 7. COUNTER TELEMETRY (ToF Laser Distance + Queue Length Stream)
CREATE TABLE IF NOT EXISTS counter_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    counter_id UUID NOT NULL REFERENCES counters(id) ON DELETE CASCADE,
    distance_mm INTEGER NOT NULL,
    occupancy_state VARCHAR(32) NOT NULL,
    queue_length INTEGER NOT NULL,
    current_token_id UUID REFERENCES tokens(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    is_demo BOOLEAN DEFAULT FALSE
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_created ON tokens(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(workspace_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_time ON counter_telemetry(counter_id, recorded_at DESC);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE counter_telemetry ENABLE ROW LEVEL SECURITY;

-- POLICIES (Read-accessible to authenticated and anon users for prototype visibility)
CREATE POLICY "Allow public read for demo workspaces" ON workspaces FOR SELECT USING (true);
CREATE POLICY "Allow public read for categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read for devices" ON devices FOR SELECT USING (true);
CREATE POLICY "Allow public read for counters" ON counters FOR SELECT USING (true);
CREATE POLICY "Allow public read for tokens" ON tokens FOR SELECT USING (true);
CREATE POLICY "Allow public read for events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public read for telemetry" ON counter_telemetry FOR SELECT USING (true);

-- ENABLE SUPABASE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE counters;
ALTER PUBLICATION supabase_realtime ADD TABLE tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE counter_telemetry;

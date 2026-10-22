-- ========================================================================
-- QueuePulse: Seed required application records (migration 0002)
-- Run in the Supabase SQL editor AFTER schema.sql and 0001_atomic_queue_ops.sql.
-- Idempotent: every INSERT is guarded by a NOT EXISTS check on a natural key,
-- so re-running this file does not create duplicates or touch existing rows.
-- Names mirror the existing Demo Mode mock data (src/lib/mock-data.ts) so
-- Live Mode and Demo Mode look consistent to someone switching between them.
-- Device secret hashes are NOT set here — run scripts/provision-device.mjs
-- per physical device and apply its printed UPDATE statement separately.
-- ========================================================================

DO $$
DECLARE
    v_workspace_id UUID;
    v_cat_doc UUID;
    v_cat_acc UUID;
    v_cat_enq UUID;
    v_dev1 UUID;
    v_dev2 UUID;
    v_dev3 UUID;
    v_dev4 UUID;
BEGIN
    -- 1. Workspace (one row; reuse if it already exists)
    SELECT id INTO v_workspace_id FROM workspaces WHERE name = 'University Student Administration Center' LIMIT 1;
    IF v_workspace_id IS NULL THEN
        INSERT INTO workspaces (name, location, timezone)
        VALUES ('University Student Administration Center', 'Main Campus', 'UTC')
        RETURNING id INTO v_workspace_id;
    END IF;

    -- 2. Service categories
    SELECT id INTO v_cat_doc FROM service_categories WHERE workspace_id = v_workspace_id AND code = 'DOC';
    IF v_cat_doc IS NULL THEN
        INSERT INTO service_categories (workspace_id, code, name, description, prefix, sla_target_seconds, color)
        VALUES (v_workspace_id, 'DOC', 'Documents & Transcripts', 'Degree and transcript requests', 'DOC', 900, '#b8ef79')
        RETURNING id INTO v_cat_doc;
    END IF;

    SELECT id INTO v_cat_acc FROM service_categories WHERE workspace_id = v_workspace_id AND code = 'ACC';
    IF v_cat_acc IS NULL THEN
        INSERT INTO service_categories (workspace_id, code, name, description, prefix, sla_target_seconds, color)
        VALUES (v_workspace_id, 'ACC', 'Accounts & Tuition Fees', 'Billing and payment queries', 'ACC', 900, '#79c7ef')
        RETURNING id INTO v_cat_acc;
    END IF;

    SELECT id INTO v_cat_enq FROM service_categories WHERE workspace_id = v_workspace_id AND code = 'ENQ';
    IF v_cat_enq IS NULL THEN
        INSERT INTO service_categories (workspace_id, code, name, description, prefix, sla_target_seconds, color)
        VALUES (v_workspace_id, 'ENQ', 'General Student Enquiries', 'Walk-in general questions', 'ENQ', 600, '#efb879')
        RETURNING id INTO v_cat_enq;
    END IF;

    -- 3. Devices (one ESP32 node per counter). secret_hash left NULL —
    -- authentication will reject requests until provisioned.
    SELECT id INTO v_dev1 FROM devices WHERE device_code = 'ESP32-NODE-DOC-01';
    IF v_dev1 IS NULL THEN
        INSERT INTO devices (workspace_id, device_code, firmware_version, online)
        VALUES (v_workspace_id, 'ESP32-NODE-DOC-01', 'v1.0.0-unflashed', FALSE)
        RETURNING id INTO v_dev1;
    END IF;

    SELECT id INTO v_dev2 FROM devices WHERE device_code = 'ESP32-NODE-DOC-02';
    IF v_dev2 IS NULL THEN
        INSERT INTO devices (workspace_id, device_code, firmware_version, online)
        VALUES (v_workspace_id, 'ESP32-NODE-DOC-02', 'v1.0.0-unflashed', FALSE)
        RETURNING id INTO v_dev2;
    END IF;

    SELECT id INTO v_dev3 FROM devices WHERE device_code = 'ESP32-NODE-ACC-01';
    IF v_dev3 IS NULL THEN
        INSERT INTO devices (workspace_id, device_code, firmware_version, online)
        VALUES (v_workspace_id, 'ESP32-NODE-ACC-01', 'v1.0.0-unflashed', FALSE)
        RETURNING id INTO v_dev3;
    END IF;

    SELECT id INTO v_dev4 FROM devices WHERE device_code = 'ESP32-NODE-ENQ-01';
    IF v_dev4 IS NULL THEN
        INSERT INTO devices (workspace_id, device_code, firmware_version, online)
        VALUES (v_workspace_id, 'ESP32-NODE-ENQ-01', 'v1.0.0-unflashed', FALSE)
        RETURNING id INTO v_dev4;
    END IF;

    -- 4. Counters, one per category (DOC gets two, matching the mock layout)
    IF NOT EXISTS (SELECT 1 FROM counters WHERE workspace_id = v_workspace_id AND code = 'DOC-01') THEN
        INSERT INTO counters (workspace_id, code, name, service_category_id, device_id, status, occupancy_state, current_distance_mm, distance_threshold_mm)
        VALUES (v_workspace_id, 'DOC-01', 'Counter 1 · Degrees & Transcripts', v_cat_doc, v_dev1, 'ACTIVE', 'CLEAR', 1200, 800);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM counters WHERE workspace_id = v_workspace_id AND code = 'DOC-02') THEN
        INSERT INTO counters (workspace_id, code, name, service_category_id, device_id, status, occupancy_state, current_distance_mm, distance_threshold_mm)
        VALUES (v_workspace_id, 'DOC-02', 'Counter 2 · Notarization & Verifications', v_cat_doc, v_dev2, 'ACTIVE', 'CLEAR', 1200, 800);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM counters WHERE workspace_id = v_workspace_id AND code = 'ACC-01') THEN
        INSERT INTO counters (workspace_id, code, name, service_category_id, device_id, status, occupancy_state, current_distance_mm, distance_threshold_mm)
        VALUES (v_workspace_id, 'ACC-01', 'Counter 3 · Tuition & Fee Accounts', v_cat_acc, v_dev3, 'ACTIVE', 'CLEAR', 1200, 800);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM counters WHERE workspace_id = v_workspace_id AND code = 'ENQ-01') THEN
        INSERT INTO counters (workspace_id, code, name, service_category_id, device_id, status, occupancy_state, current_distance_mm, distance_threshold_mm)
        VALUES (v_workspace_id, 'ENQ-01', 'Counter 4 · General Student Helpdesk', v_cat_enq, v_dev4, 'ACTIVE', 'CLEAR', 1200, 800);
    END IF;
END $$;

-- Verify after running:
-- select w.name as workspace, c.code, c.name, sc.code as category from counters c
--   join workspaces w on w.id = c.workspace_id join service_categories sc on sc.id = c.service_category_id;

-- ========================================================================
-- QueuePulse: Atomic queue operations (migration 0001)
-- Run this in the Supabase SQL editor (or `supabase db push`) AFTER schema.sql.
-- These RPCs are called by the server-side API routes using the
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS, so they are the only
-- place that is allowed to mutate tokens/counters. Row locking
-- (FOR UPDATE / advisory locks) makes them safe under concurrent calls.
-- ========================================================================

-- Per-category sequence counter, used to generate token codes atomically
-- instead of "SELECT count(*) + 1" (which races under concurrent inserts).
CREATE TABLE IF NOT EXISTS token_sequences (
    service_category_id UUID PRIMARY KEY REFERENCES service_categories(id) ON DELETE CASCADE,
    last_value INTEGER NOT NULL DEFAULT 0
);

-- Columns/indexes added by this migration (placed first so every function
-- body below can rely on them existing, even though plpgsql bodies are only
-- checked at call time, not at CREATE FUNCTION time).
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS rfid_session_uid VARCHAR(64);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS secret_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_tokens_rfid_uid ON tokens(rfid_session_uid) WHERE rfid_session_uid IS NOT NULL;

-- Hard DB-level guarantee against the TOCTOU race in register_token(): even
-- if two concurrent calls both pass the pre-check SELECT, only one INSERT
-- can satisfy this partial unique index — the loser gets a unique_violation,
-- which register_token() catches and turns into DUPLICATE_ACTIVE_TOKEN.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_unique_active_rfid
    ON tokens(rfid_session_uid)
    WHERE rfid_session_uid IS NOT NULL
      AND status IN ('WAITING', 'CALLED', 'IN_SERVICE', 'PENDING_CLEARANCE', 'GRACE_QUEUE');

-- 1. REGISTER TOKEN (RFID tap at kiosk / category select)
-- Atomically allocates the next token number for the category and prevents
-- a UID from holding two simultaneously-active tokens.
CREATE OR REPLACE FUNCTION register_token(
    p_workspace_id UUID,
    p_service_category_id UUID,
    p_rfid_uid TEXT
) RETURNS tokens AS $$
DECLARE
    v_prefix VARCHAR(8);
    v_next_val INTEGER;
    v_token_code VARCHAR(32);
    v_existing_active_count INTEGER;
    v_new_token tokens;
BEGIN
    IF p_rfid_uid IS NOT NULL THEN
        SELECT COUNT(*) INTO v_existing_active_count
        FROM tokens
        WHERE rfid_session_uid = p_rfid_uid
          AND status IN ('WAITING', 'CALLED', 'IN_SERVICE', 'PENDING_CLEARANCE', 'GRACE_QUEUE');

        IF v_existing_active_count > 0 THEN
            RAISE EXCEPTION 'DUPLICATE_ACTIVE_TOKEN' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    SELECT prefix INTO v_prefix FROM service_categories WHERE id = p_service_category_id;
    IF v_prefix IS NULL THEN
        RAISE EXCEPTION 'UNKNOWN_CATEGORY' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO token_sequences (service_category_id, last_value)
    VALUES (p_service_category_id, 1)
    ON CONFLICT (service_category_id)
    DO UPDATE SET last_value = token_sequences.last_value + 1
    RETURNING last_value INTO v_next_val;

    v_token_code := v_prefix || '-' || LPAD(v_next_val::TEXT, 3, '0');

    BEGIN
        INSERT INTO tokens (
            workspace_id, service_category_id, token_code, status, priority,
            rfid_session_uid, rfid_verified
        ) VALUES (
            p_workspace_id, p_service_category_id, v_token_code, 'WAITING', 'NORMAL',
            p_rfid_uid, FALSE
        ) RETURNING * INTO v_new_token;
    EXCEPTION WHEN unique_violation THEN
        RAISE EXCEPTION 'DUPLICATE_ACTIVE_TOKEN' USING ERRCODE = 'P0001';
    END;

    RETURN v_new_token;
END;
$$ LANGUAGE plpgsql;

-- 2. CALL NEXT TOKEN on a counter
-- Locks the counter row so two concurrent "NEXT" calls on the same counter
-- can't both claim a token. Grace-queue tokens take priority over FIFO waiting.
CREATE OR REPLACE FUNCTION call_next_token(
    p_counter_id UUID
) RETURNS tokens AS $$
DECLARE
    v_counter counters;
    v_active_count INTEGER;
    v_eligible tokens;
BEGIN
    SELECT * INTO v_counter FROM counters WHERE id = p_counter_id FOR UPDATE;
    IF v_counter IS NULL THEN
        RAISE EXCEPTION 'COUNTER_NOT_FOUND' USING ERRCODE = 'P0003';
    END IF;

    IF v_counter.occupancy_state = 'OCCUPIED'
       OR v_counter.current_distance_mm < v_counter.distance_threshold_mm THEN
        RAISE EXCEPTION 'DESK_OCCUPIED' USING ERRCODE = 'P0004';
    END IF;

    IF v_counter.current_token_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_active_count FROM tokens
        WHERE id = v_counter.current_token_id
          AND status IN ('CALLED', 'IN_SERVICE', 'PENDING_CLEARANCE');
        IF v_active_count > 0 THEN
            RAISE EXCEPTION 'ACTIVE_SESSION_EXISTS' USING ERRCODE = 'P0005';
        END IF;
    END IF;

    SELECT * INTO v_eligible FROM tokens
    WHERE service_category_id = v_counter.service_category_id
      AND status = 'GRACE_QUEUE'
    ORDER BY moved_to_grace_at ASC
    LIMIT 1 FOR UPDATE SKIP LOCKED;

    IF v_eligible IS NULL THEN
        SELECT * INTO v_eligible FROM tokens
        WHERE service_category_id = v_counter.service_category_id
          AND status = 'WAITING'
        ORDER BY created_at ASC
        LIMIT 1 FOR UPDATE SKIP LOCKED;
    END IF;

    IF v_eligible IS NULL THEN
        RAISE EXCEPTION 'QUEUE_EMPTY' USING ERRCODE = 'P0006';
    END IF;

    UPDATE tokens SET status = 'CALLED', counter_id = p_counter_id, called_at = NOW()
    WHERE id = v_eligible.id
    RETURNING * INTO v_eligible;

    UPDATE counters SET current_token_id = v_eligible.id WHERE id = p_counter_id;

    RETURN v_eligible;
END;
$$ LANGUAGE plpgsql;

-- 3. VERIFY RFID at counter (transition CALLED -> IN_SERVICE)
CREATE OR REPLACE FUNCTION verify_token_rfid(
    p_counter_id UUID,
    p_rfid_uid TEXT
) RETURNS tokens AS $$
DECLARE
    v_counter counters;
    v_token tokens;
BEGIN
    SELECT * INTO v_counter FROM counters WHERE id = p_counter_id FOR UPDATE;
    IF v_counter IS NULL OR v_counter.current_token_id IS NULL THEN
        RAISE EXCEPTION 'NO_ACTIVE_TOKEN' USING ERRCODE = 'P0007';
    END IF;

    SELECT * INTO v_token FROM tokens WHERE id = v_counter.current_token_id FOR UPDATE;
    IF v_token.status != 'CALLED' THEN
        RAISE EXCEPTION 'TOKEN_NOT_CALLED' USING ERRCODE = 'P0008';
    END IF;

    IF v_token.rfid_session_uid IS NOT NULL AND v_token.rfid_session_uid != p_rfid_uid THEN
        RAISE EXCEPTION 'RFID_MISMATCH' USING ERRCODE = 'P0009';
    END IF;

    UPDATE tokens SET status = 'IN_SERVICE', service_started_at = NOW(),
        rfid_verified = TRUE, rfid_session_uid = p_rfid_uid
    WHERE id = v_token.id
    RETURNING * INTO v_token;

    UPDATE counters SET occupancy_state = 'OCCUPIED' WHERE id = p_counter_id;

    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- 4. COMPLETE SERVICE (staff DONE button)
CREATE OR REPLACE FUNCTION complete_token(
    p_counter_id UUID
) RETURNS tokens AS $$
DECLARE
    v_counter counters;
    v_token tokens;
    v_is_clear BOOLEAN;
BEGIN
    SELECT * INTO v_counter FROM counters WHERE id = p_counter_id FOR UPDATE;
    IF v_counter IS NULL OR v_counter.current_token_id IS NULL THEN
        RAISE EXCEPTION 'NO_ACTIVE_TOKEN' USING ERRCODE = 'P0007';
    END IF;

    SELECT * INTO v_token FROM tokens WHERE id = v_counter.current_token_id FOR UPDATE;
    IF v_token.status != 'IN_SERVICE' THEN
        RAISE EXCEPTION 'TOKEN_NOT_IN_SERVICE' USING ERRCODE = 'P0010';
    END IF;

    UPDATE tokens SET status = 'COMPLETED', service_completed_at = NOW(),
        service_seconds = GREATEST(1, EXTRACT(EPOCH FROM (NOW() - v_token.service_started_at))::INTEGER)
    WHERE id = v_token.id
    RETURNING * INTO v_token;

    v_is_clear := v_counter.current_distance_mm >= v_counter.distance_threshold_mm;

    UPDATE counters SET
        occupancy_state = CASE WHEN v_is_clear THEN 'CLEAR' ELSE 'OCCUPIED' END,
        current_token_id = CASE WHEN v_is_clear THEN NULL ELSE current_token_id END
    WHERE id = p_counter_id;

    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- 5. REPORT CLEARANCE (ToF telemetry) — unassigns counter once a
-- COMPLETED/MISSED/CANCELLED token's desk is confirmed vacated.
CREATE OR REPLACE FUNCTION report_clearance(
    p_counter_id UUID,
    p_distance_mm INTEGER
) RETURNS counters AS $$
DECLARE
    v_counter counters;
    v_is_clear BOOLEAN;
    v_token_status TEXT;
BEGIN
    SELECT * INTO v_counter FROM counters WHERE id = p_counter_id FOR UPDATE;
    IF v_counter IS NULL THEN
        RAISE EXCEPTION 'COUNTER_NOT_FOUND' USING ERRCODE = 'P0003';
    END IF;

    v_is_clear := p_distance_mm >= v_counter.distance_threshold_mm;

    IF v_is_clear AND v_counter.current_token_id IS NOT NULL THEN
        SELECT status INTO v_token_status FROM tokens WHERE id = v_counter.current_token_id;
        IF v_token_status IN ('COMPLETED', 'MISSED', 'CANCELLED') THEN
            UPDATE counters SET current_token_id = NULL WHERE id = p_counter_id;
        END IF;
    END IF;

    UPDATE counters SET
        current_distance_mm = p_distance_mm,
        occupancy_state = CASE WHEN v_is_clear THEN 'CLEAR' ELSE 'OCCUPIED' END
    WHERE id = p_counter_id
    RETURNING * INTO v_counter;

    RETURN v_counter;
END;
$$ LANGUAGE plpgsql;

-- 6. MOVE MISSED (CALLED) TOKEN TO GRACE QUEUE
CREATE OR REPLACE FUNCTION move_token_to_grace(
    p_counter_id UUID
) RETURNS tokens AS $$
DECLARE
    v_counter counters;
    v_token tokens;
BEGIN
    SELECT * INTO v_counter FROM counters WHERE id = p_counter_id FOR UPDATE;
    IF v_counter IS NULL OR v_counter.current_token_id IS NULL THEN
        RAISE EXCEPTION 'NO_ACTIVE_TOKEN' USING ERRCODE = 'P0007';
    END IF;

    SELECT * INTO v_token FROM tokens WHERE id = v_counter.current_token_id FOR UPDATE;
    IF v_token.status != 'CALLED' THEN
        RAISE EXCEPTION 'TOKEN_NOT_CALLED' USING ERRCODE = 'P0008';
    END IF;

    UPDATE tokens SET status = 'GRACE_QUEUE', priority = 'GRACE',
        missed_at = NOW(), moved_to_grace_at = NOW(), counter_id = NULL
    WHERE id = v_token.id
    RETURNING * INTO v_token;

    UPDATE counters SET current_token_id = NULL WHERE id = p_counter_id;

    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- LOCK DOWN RPC ACCESS
-- Supabase/PostgREST grants EXECUTE on new functions to PUBLIC by default,
-- which would let any client holding only the anon key call these RPCs
-- directly over the REST API (`supabase.rpc(...)`), completely bypassing
-- the device-secret checks in the Next.js API routes. These functions must
-- only ever run as the service_role (which already bypasses RLS), so we
-- explicitly revoke public/anon/authenticated access.
-- ========================================================================
REVOKE EXECUTE ON FUNCTION register_token(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION call_next_token(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION verify_token_rfid(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION complete_token(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION report_clearance(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION move_token_to_grace(UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION register_token(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION call_next_token(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION verify_token_rfid(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION complete_token(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION report_clearance(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION move_token_to_grace(UUID) TO service_role;

-- ========================================================================
-- HIDE devices.secret_hash FROM ANON/AUTHENTICATED
-- The existing "Allow public read for devices" RLS policy (schema.sql) is
-- row-level only — it does not hide columns. Without this, any client
-- holding just the anon key could `select('secret_hash')` and read every
-- device's secret hash. Re-grant SELECT on the safe column subset only;
-- the dashboard's device cards don't use secret_hash.
-- ========================================================================
REVOKE SELECT ON devices FROM anon, authenticated;
GRANT SELECT (id, workspace_id, device_code, firmware_version, last_seen_at, online, wifi_signal, uptime_seconds, created_at)
    ON devices TO anon, authenticated;

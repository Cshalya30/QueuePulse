-- ========================================================================
-- QueuePulse: Continuous RFID registration at the counter node (migration 0003)
-- Run this in the Supabase SQL editor (or `supabase db push`) AFTER 0001 and 0002.
-- ========================================================================
--
-- Design change from migration 0001: the counter-node RFID reader is no
-- longer a "verify a CALLED token" step. Every physical tap at the counter
-- is now submitted as a registration attempt, independent of the counter's
-- current queue/service state. register_at_counter() is the single,
-- atomic entry point for that: it always writes one audit row to `events`
-- (accepted or rejected) in the SAME transaction as the token
-- insert/rejection, so the universal event log can never miss an attempt
-- or desync from what the tokens table actually did. Only an accepted
-- attempt creates a WAITING token; duplicate-active-UID protection is the
-- same unique partial index from migration 0001
-- (idx_tokens_unique_active_rfid), so concurrent taps of the same card are
-- still safe under real concurrency, not just under this function's
-- pre-check.
--
-- Consequence for call_next_token(): because RFID identity is now proven
-- at registration time (not at call time), staff pressing NEXT no longer
-- needs a second "tap to verify" step — call_next_token() is redefined
-- below to move the next eligible token straight to IN_SERVICE. The old
-- CALLED + verify_token_rfid() + 60s-miss-to-Grace flow (migration 0001)
-- is left in place and still callable (nothing is dropped from the
-- schema), but this firmware's steady-state flow no longer drives it,
-- since tokens no longer pass through CALLED on the way to IN_SERVICE.
-- Any dashboard control still gated on status === 'CALLED' (manual "Tap
-- RFID" / "Send to Grace" buttons) will simply have nothing to act on
-- going forward — documented, not silently broken.
-- ========================================================================

CREATE OR REPLACE FUNCTION register_at_counter(
    p_counter_id UUID,
    p_device_id UUID,
    p_rfid_uid TEXT
) RETURNS jsonb AS $$
DECLARE
    v_counter counters;
    v_existing tokens;
    v_new_token tokens;
BEGIN
    SELECT * INTO v_counter FROM counters WHERE id = p_counter_id;
    IF v_counter IS NULL THEN
        RAISE EXCEPTION 'COUNTER_NOT_FOUND' USING ERRCODE = 'P0003';
    END IF;

    IF v_counter.service_category_id IS NULL THEN
        INSERT INTO events (workspace_id, device_id, counter_id, event_type, title, description, severity, source)
        VALUES (v_counter.workspace_id, p_device_id, p_counter_id, 'RFID_TAP_REJECTED',
                'Registration rejected',
                'Counter has no service_category_id configured — tap could not be routed to a queue.',
                'critical', 'ESP32_EDGE');
        RETURN jsonb_build_object('accepted', false, 'reason', 'UNKNOWN_CATEGORY');
    END IF;

    -- Fast pre-check so a duplicate tap logs a clear, specific reason
    -- instead of a generic constraint-violation message. The real
    -- concurrency guard is still the partial unique index below.
    SELECT * INTO v_existing FROM tokens
    WHERE rfid_session_uid = p_rfid_uid
      AND status IN ('WAITING', 'CALLED', 'IN_SERVICE', 'PENDING_CLEARANCE', 'GRACE_QUEUE')
    LIMIT 1;

    IF v_existing.id IS NOT NULL THEN
        INSERT INTO events (workspace_id, device_id, counter_id, token_id, event_type, title, description, severity, source)
        VALUES (v_counter.workspace_id, p_device_id, p_counter_id, v_existing.id, 'RFID_TAP_REJECTED',
                'Duplicate registration attempt',
                'UID ' || p_rfid_uid || ' already active as token ' || v_existing.token_code || ' (status ' || v_existing.status || ').',
                'warning', 'ESP32_EDGE');
        RETURN jsonb_build_object(
            'accepted', false,
            'reason', 'DUPLICATE_ACTIVE_TOKEN',
            'existingTokenCode', v_existing.token_code,
            'existingStatus', v_existing.status
        );
    END IF;

    BEGIN
        -- Reuses register_token() (migration 0001) so token-number
        -- sequencing and the unique-index race handling stay in one place.
        v_new_token := register_token(v_counter.workspace_id, v_counter.service_category_id, p_rfid_uid);
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO events (workspace_id, device_id, counter_id, event_type, title, description, severity, source)
        VALUES (v_counter.workspace_id, p_device_id, p_counter_id, 'RFID_TAP_REJECTED',
                'Registration rejected', SQLERRM, 'warning', 'ESP32_EDGE');
        RETURN jsonb_build_object('accepted', false, 'reason', SQLERRM);
    END;

    INSERT INTO events (workspace_id, device_id, counter_id, token_id, event_type, title, description, severity, source)
    VALUES (v_counter.workspace_id, p_device_id, p_counter_id, v_new_token.id, 'RFID_TAP_ACCEPTED',
            'Registered token ' || v_new_token.token_code,
            'New WAITING token created from a counter-node RFID tap.',
            'success', 'ESP32_EDGE');

    RETURN jsonb_build_object('accepted', true, 'token', to_jsonb(v_new_token));
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION register_at_counter(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION register_at_counter(UUID, UUID, TEXT) TO service_role;

-- Redefine call_next_token(): go straight to IN_SERVICE. Identity was
-- already proven at registration time via register_at_counter(); no
-- second "tap to verify" step is required or expected from the firmware.
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

    UPDATE tokens SET status = 'IN_SERVICE', called_at = NOW(), service_started_at = NOW()
    WHERE id = v_eligible.id
    RETURNING * INTO v_eligible;

    UPDATE counters SET current_token_id = v_eligible.id, occupancy_state = 'OCCUPIED'
    WHERE id = p_counter_id;

    RETURN v_eligible;
END;
$$ LANGUAGE plpgsql;

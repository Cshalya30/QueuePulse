# Physical hardware test procedure

Run after flashing one ESP32 node and provisioning its device secret (see `README.md`). Wiring reference: RC522 RST=GPIO22, OLED/VL53L0X I2C on SDA=21/SCL=17 (no pin conflict with this wiring — see `README.md`). Check off each row. Compilation was verified (see `README.md` "Compilation status"); every row below is hardware behavior, not yet confirmed until you run it. Watch the Serial Monitor (115200 baud) alongside the OLED/dashboard — it now logs every card detection, new-presentation vs. repeat-ignored, registration accepted/rejected with reason, and HTTP status per request.

This revision uses **continuous RFID registration** (migration 0003): a tap at the counter now registers the card directly into the queue, unconditionally — it is not a "verify a called token" step. NEXT then serves the next already-registered person directly, with no second tap required.

## Core flow

| # | Step | Expected result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Power on the node | OLED shows "QueuePulse / Booting..." then "Ready / Tap to register" | |
| 2 | Observe LEDs at idle, desk clear | Green LED on, red/yellow off | |
| 3 | Tap a new, not-previously-registered RFID card | OLED shows "Registered! / <token code> / Joined the queue"; Serial shows `[RFID] Registration ACCEPTED`; a WAITING token for this card appears in the dashboard queue lane (`/app/queue`) | |
| 4 | Immediately tap the same card again (while it is still WAITING) | OLED shows "Already registered / <token code> / Card still active" or "Not registered: DUPLICATE_ACTIVE_TOKEN"; Serial shows `[RFID] Registration REJECTED: DUPLICATE_ACTIVE_TOKEN"; dashboard shows only ONE token for this card, not two | |
| 5 | Check the universal event log (`/app/events`) after steps 3–4 | Two events for this card: one `RFID_TAP_ACCEPTED`, one `RFID_TAP_REJECTED` — both attempts audited even though only one created a token | |
| 6 | Tap a second, different new card | OLED shows "Registered!" with a new token code; dashboard now shows two WAITING tokens | |
| 7 | Press NEXT | OLED shows "Now serving: <code> / Send C when done" directly — no "Tap RFID card..." intermediate step; red LED on; dashboard token status goes straight to IN_SERVICE (no CALLED stage); Serial shows the `/call` HTTP status, no `/rfid` or `/register` call was needed to start service | |
| 8 | Press DONE | OLED shows "Service complete", dashboard token COMPLETED | |
| 9 | Step away from the ToF sensor (>800mm) | Green LED returns, counter unassigns in dashboard | |
| 10 | Press NEXT again before stepping away (desk still occupied) | OLED/dashboard shows "Desk Occupied" rejection, no token called | |
| 11 | Press NEXT with no WAITING tokens registered | OLED shows "Blocked: No waiting tokens available in queue." (QUEUE_EMPTY) | |
| 12 | Rapidly double-press DONE | Second press rejected ("No active service") — no duplicate COMPLETED | |

## Continuous registration edge cases

| # | Step | Expected result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Tap card A, remove it, tap card A again (after its first token reaches COMPLETED) | Second tap is accepted — same UID can register again once its prior token is no longer active | |
| 14 | Hold card A against the reader continuously for 5+ seconds | Exactly ONE registration request is sent (one Serial `[RFID] New presentation` line); no repeated `/register` calls while the card stays in place; only one token created | |
| 15 | Remove card A, wait ~1 second, present it again (while its prior token is still WAITING) | Serial shows "Card removed... Re-armed" then a new `[RFID] New presentation` line; the backend correctly rejects it again as a duplicate (not a firmware-level block) | |
| 16 | Tap a card while a token is already IN_SERVICE at this counter (mid-service) | Tap is still processed as a normal registration attempt for the queue, independent of the counter's NEXT/DONE state — accepted if the UID is new, rejected if it's a duplicate, exactly as it would be at any other time | |
| 17 | Disconnect Wi-Fi, then tap a card while offline | OLED shows "OFFLINE / Registration / not sent - retry tap"; no false "Registered!"; nothing is created in the dashboard | |
| 18 | Restore Wi-Fi, tap the same card again | Node reconnects automatically within ~10s; the tap is now processed normally — accepted or rejected per the backend's actual state, never silently dropped | |
| 19 | Use an invalid/garbage `DEVICE_SECRET` (test build only) | All requests (register/call/done/telemetry) are rejected with 401 "Invalid device secret."; OLED/Serial show the rejection; nothing succeeds | |
| 20 | Tap ~10 cards in a row in normal use over a few minutes | No tap ever requires a manual reset to be recognized; if a read ever fails, Serial shows a numbered failure count, and after 6 consecutive failures a `[RFID] ... reinitializing PCD` line appears, after which reads resume | |
| 21 | Power-cycle the node mid-service (token IN_SERVICE) | On reboot, node starts IDLE; dashboard token remains IN_SERVICE until staff presses DONE — confirms no local-only state is lost from the database's perspective | |

## What this revision does NOT test (documented, not silently skipped)

- **True concurrent duplicate taps** (two requests arriving at the database at the exact same instant) require two physical readers or a scripted concurrent HTTP test against a live deployment — a single ESP32 node tapping sequentially (row 4) can only prove the backend's business-rule rejection works, not the database-level race condition itself. The partial unique index (`idx_tokens_unique_active_rfid`, migration 0001) is what actually guarantees this under real concurrency; that guarantee is covered by reasoning about the SQL, and by the `tests/rpc-simulation.test.mjs` pure-JS simulation, not by this physical procedure.
- The dashboard's manual "Tap RFID" / "Send to Grace" buttons (gated on a `CALLED` token that this flow no longer produces) are not exercised here — see `README.md` "Known limitations".

Record failures with OLED text / Serial Monitor lines / dashboard event log entries for debugging.

# QueuePulse ESP32 Counter Node Firmware

Board: ESP32 Dev Module. Compiled successfully against the ESP32 Arduino core — see "Compilation status" below. Physical hardware behavior is still unverified; follow `TEST_PROCEDURE.md` before trusting it at a live counter.

## Wiring (fixed in the sketch, matches the bench-tested build)
| Component | Pin(s) |
|---|---|
| RC522 RFID (SPI) | SS=5, RST=22, SCK=18, MISO=19, MOSI=23 |
| SSD1306 OLED (I2C) | SDA=21, SCL=17, address 0x3C |
| VL53L0X ToF (I2C) | same bus as OLED: SDA=21, SCL=17 |
| NEXT / DONE buttons | GPIO 25 / GPIO 26, active-LOW |
| LEDs (green/red/yellow) | GPIO 27 / GPIO 14 / GPIO 12 |
| Buzzer (optional, disabled by default) | GPIO 13 |

This wiring puts the OLED/VL53L0X I2C clock on **GPIO 17**, not the ESP32's default I2C SCL (GPIO 22) — so there is no conflict with RC522 RST, which is also GPIO 22. `Wire.begin(21, 17)` in `setup()` is what makes that true. If you ever rewire the OLED/VL53L0X back onto the default SCL=22, you must move `RFID_RST_PIN` off 22 (e.g. to GPIO 4) to avoid the two colliding.

## Arduino libraries required (Library Manager)
- `MFRC522` (miguelbalboa)
- `Adafruit SSD1306` + `Adafruit GFX Library`
- `Adafruit VL53L0X`
- `ArduinoJson` (v7+)
- ESP32 board package (espressif) for `WiFi.h` / `WiFiClientSecure.h` / `HTTPClient.h`

## Before flashing
1. **Never commit real credentials into `esp32_counter_node.ino`** — it's tracked by git and this repo's history already contains an exposed Wi-Fi password and device secret from an earlier mistake (rotated; see "Known limitations"). Instead, copy it to `esp32_counter_node.local.ino` (already in `.gitignore`) and fill in real values there; open that file in Arduino IDE to flash.
2. Fill in: `WIFI_SSID`, `WIFI_PASSWORD`, `API_BASE_URL` (your Vercel deployment, no trailing slash), `DEVICE_CODE`, `COUNTER_ID` (UUID from the `counters` table). `WORKSPACE_ID` is optional — leave it `""` to skip event logging, or set it (UUID from the `workspaces` table) to also log `DEVICE_BOOT`/`CALL_REJECTED` events via `/api/events`, which requires `workspaceId`.
3. Provision a device secret: `node scripts/provision-device.mjs ESP32-NODE-DOC-01`, paste the printed secret into `DEVICE_SECRET` in your **local, uncommitted** copy, run the printed `UPDATE devices SET secret_hash = ...` in the Supabase SQL editor (or apply it as a single targeted row update — never a broad `UPDATE` without a `WHERE device_code = ...` predicate). Never paste the plaintext secret anywhere that gets committed, logged, or shared.
4. Wiring is already fixed per the table above — no pin changes needed unless your physical build differs from it.

## Compilation status
Verified compiling, 2026-10-23 (continuous-registration revision), via:
```
arduino-cli compile --jobs 1 --fqbn esp32:esp32:esp32 firmware/esp32_counter_node
```
Result (exit code 0, no errors):
```
Sketch uses 1096928 bytes (83%) of program storage space. Maximum is 1310720 bytes.
Global variables use 51608 bytes (15%) of dynamic memory, leaving 276072 bytes for local variables. Maximum is 327680 bytes.
```
Libraries resolved: MFRC522 1.4.12, Adafruit GFX Library 1.13.0, Adafruit BusIO 1.17.4, Adafruit SSD1306 2.5.17, Adafruit_VL53L0X 1.2.5, ArduinoJson 7.4.3, against esp32:esp32 core 3.3.12 (ESP32 Dev Module / `esp32:esp32:esp32`). `npm test` (28/28, including new `register_at_counter` coverage), `tsc --noEmit`, and `npm run build` were also re-run after this change and all pass, with the new `/api/counters/[counterId]/register` route appearing in the build output.

**This verifies the code builds — it is not a claim that the hardware works.** Flash and run `TEST_PROCEDURE.md` before trusting it at a live counter.

## RFID re-read fix (2026-10-23)
Symptom reported: the first card tap worked (OLED + dashboard updated), but later taps sometimes did nothing until the ESP32 was power-cycled. Changes made in `pollRfid()` (replacing the previous inline RFID block in `loop()`):
1. **`PCD_StopCrypto1()` was missing.** Every read path previously called only `PICC_HaltA()`. Both are now called unconditionally after every read attempt — success, failed UID read, or a repeat of the card still sitting on the antenna — so the reader's internal session state can't get stuck.
2. **Card re-arm instead of a 1.5s time cooldown.** A UID is now tracked as "currently present"; the same UID read again while still on the antenna is recognized as a repeat and not resent to the backend (no duplicate verify calls while a card is held down). Once the reader reports no card for `CARD_ABSENT_REARM_MS` (600ms), that UID is cleared — the same card (or a different one) is treated as a brand-new presentation the next time it's read. No UID is permanently ignored.
3. **Soft reinit on a wedged reader.** A counter of consecutive "card present but `PICC_ReadCardSerial()` failed" events triggers `rfid.PCD_Init()` after `RFID_FAIL_REINIT_THRESHOLD` (6) consecutive failures, instead of requiring a manual reset.
4. Added `Serial` diagnostics (115200 baud) for: card detected, UID read, new-presentation vs. repeat-ignored, HTTP status per request, HTTP/network failures, and reinit events.
5. No change to API payloads, device auth, token state machine, LEDs, buttons, sensor telemetry, or pin assignments (RC522 pins unchanged — nothing in the actual wiring/code indicated a pin problem, only the cleanup/re-arm logic).

## What it does
Each button press / RFID tap / ToF sample is a plain HTTPS POST to the Next.js API routes under `src/app/api/`, authenticated with `x-device-secret`. The server-side Postgres functions in `supabase/migrations/0001_atomic_queue_ops.sql` and `0003_continuous_rfid_registration.sql` are the single source of truth for state transitions — the firmware never computes "is this allowed," it just reports the button press / tap and displays whatever the server says back (including rejections, e.g. "Desk Occupied" or a duplicate registration).

## Continuous RFID registration (migration 0003, 2026-10-23)
This revision changes what an RFID tap at the counter *means*:
- **Every tap is a registration attempt, unconditionally** — not gated on the counter's local NEXT/DONE state. It POSTs to `/api/counters/:id/register`, which calls `register_at_counter()` (new in migration 0003).
- `register_at_counter()` is atomic: it always writes one row to the universal `events` log — `RFID_TAP_ACCEPTED` or `RFID_TAP_REJECTED` — in the same transaction as the token insert/rejection. A repeated tap of an already-active card produces another audit event but never a second active token (enforced by the same partial unique index from migration 0001, `idx_tokens_unique_active_rfid` — real concurrency safety, not just an application-level check).
- Only an accepted attempt creates a `WAITING` token. The OLED never shows "Registered!" until the backend has actually returned `accepted:true`.
- **NEXT no longer requires a second RFID tap.** Because identity is proven at registration time, `call_next_token()` (redefined in migration 0003) now moves the next eligible `WAITING`/`GRACE_QUEUE` token straight to `IN_SERVICE`. There is no local `CALLED` wait-for-tap state in this firmware revision.
- **Missed/Grace-Queue workflow:** `move_token_to_grace()` and `/api/counters/:id/missed` are left in the schema/API unchanged and still function correctly (see `tests/rpc-simulation.test.mjs`), but this firmware's steady-state flow no longer drives them — there is no 60-second "waiting for a tap" window for a token to miss, since the tap already happened before the token was ever called. This is "preserved where supported," not removed, per the explicit instruction; a different caller (e.g. a future kiosk timeout for uncollected `WAITING` tokens) could still use it.
- The dashboard's manual "Tap RFID" and "Send to Grace" buttons (`src/components/overview/counter-detail-panel.tsx`) are gated on `status === "CALLED"`. Since this firmware's tokens no longer pass through `CALLED`, those two buttons will not find a token to act on in the new flow — they remain functional (not broken, not removed) for whatever legacy/manual path might still produce a `CALLED` token, but are effectively inert for this firmware's day-to-day operation. This was a deliberate scope decision (see "Known limitations") rather than a dashboard redesign, which was out of scope for this change.

## RFID re-read fix (2026-10-23, carried into this revision unchanged)
Symptom originally reported: the first card tap worked, but later taps sometimes did nothing until the ESP32 was power-cycled. Fixed in `pollRfid()`:
1. **`PCD_StopCrypto1()` was missing.** Both `PICC_HaltA()` and `PCD_StopCrypto1()` now run unconditionally after every read attempt — success, failed UID read, or a repeat of the card still sitting on the antenna — so the reader's internal session state can't get stuck.
2. **Card re-arm instead of a time cooldown.** A UID is tracked as "currently present"; the same UID read again while still on the antenna is recognized as a repeat and not resent to the backend (no duplicate registration calls while a card is held down — this satisfies the spec's "repeated taps create additional audit events but cannot create duplicate active registrations" at the firmware level too, on top of the backend's own enforcement). Once the reader reports no card for `CARD_ABSENT_REARM_MS` (600ms), that UID is cleared — the same card (or a different one) is treated as a brand-new presentation the next time it's read. No UID is permanently ignored.
3. **Soft reinit on a wedged reader.** A counter of consecutive "card present but `PICC_ReadCardSerial()` failed" events triggers `rfid.PCD_Init()` after `RFID_FAIL_REINIT_THRESHOLD` (6) consecutive failures, instead of requiring a manual reset.
4. `Serial` diagnostics (115200 baud) for: card detected, UID read, new-presentation vs. repeat-ignored, registration accepted/rejected with reason, HTTP status per request, HTTP/network failures, and reinit events.
5. No change to pin assignments — nothing in the actual wiring/code indicated a pin problem.

## Known limitations (documented, not silently swallowed)
- **TLS validation is off by default** (`USE_SETINSECURE = true`). The sketch supports real validation (`client.setCACert(ROOT_CA_PEM)` + NTP time sync, both already wired in `setup()`/`postJson()`), but ships with `ROOT_CA_PEM` empty rather than a hand-transcribed certificate string, because a subtly-wrong cert is a worse failure mode than an honest `setInsecure()` — it would look secure while not actually validating anything correctly, or silently break every request. To enable it for real: fetch the exact root CA your deployment domain chains to (`openssl s_client -connect your-deployment.vercel.app:443 -showcerts`, or download https://letsencrypt.org/certs/isrgrootx1.pem if that's what it resolves to), paste the PEM into `ROOT_CA_PEM`, set `USE_SETINSECURE` to `false`, and re-flash. This is appropriate for a prototype on trusted campus Wi-Fi; a production deployment should not skip this step.
- RFID UID alone is not a strong identity credential — it authenticates "a card was tapped that matches the one registered," not "this specific student." This matches the project's stated threat model (campus queue, not a payment system).
- No persistent offline queue (SPIFFS buffering of failed events) is implemented yet; a dropped request is retried a few times and then surfaced on the OLED, not silently discarded, but it is not stored for later resend.
- The old `verify_token_rfid()` RPC and `/api/counters/:id/rfid` route (migration 0001) are left in place, functioning, and covered by tests, but are no longer called by this firmware revision — superseded by `register_at_counter()`. They were not deleted, to minimize blast radius on anything else that might reference them.
- The dashboard's `CALLED`-gated manual controls are now effectively inert for this flow (see above) — a full dashboard redesign to reflect the continuous-registration model (e.g. a live "pending registrations" feed, removing the dead buttons) was explicitly out of scope for this change and is a reasonable follow-up.
- **2026-10-23 incident: corrupted `secret_hash` caused all device auth to fail with 401.** The `devices.secret_hash` column held a 23-character, non-hex value — not a valid SHA-256 digest of anything — most likely from a partial/garbled paste into the Supabase SQL Editor at some earlier point, not a code defect. Root-caused by checking the stored value's length and hex-validity directly (never by printing it), fixed by provisioning a fresh secret and applying it as a single targeted `UPDATE ... WHERE device_code = 'ESP32-NODE-DOC-01'` (one row, verified by row count), then confirmed live against the production API: correct secret → 2xx, wrong secret → 401, missing header → 401, unknown device → 404. Separately, the committed firmware at one point held the **hash** in `DEVICE_SECRET` instead of the **plaintext** secret — those are never interchangeable; the device always sends the plaintext, the server always hashes it to compare.
- **Credential exposure in git history:** an earlier commit put a real Wi-Fi SSID/password and a real (now-rotated) device secret into the tracked `esp32_counter_node.ino`. Those commits were not rewritten/force-pushed this close to a demo (rewriting shared history is its own risk) — treat the old Wi-Fi password as compromised and change it on the router/AP side if that's practical before the event; the device secret from that exposure has already been rotated and the live database updated. Going forward, real credentials belong only in `esp32_counter_node.local.ino` (gitignored), never in the tracked file.

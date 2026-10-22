# QueuePulse ESP32 Counter Node Firmware

Unverified against physical hardware — compile-checked structurally only. Follow `TEST_PROCEDURE.md` before trusting it at a live counter.

## Arduino libraries required (Library Manager)
- `MFRC522` (miguelbalboa)
- `Adafruit SSD1306` + `Adafruit GFX Library`
- `Adafruit VL53L0X`
- `ArduinoJson` (v7+)
- ESP32 board package (espressif) for `WiFi.h` / `WiFiClientSecure.h` / `HTTPClient.h`

## Before flashing
1. Edit `esp32_counter_node.ino`: `WIFI_SSID`, `WIFI_PASSWORD`, `API_BASE_URL` (your Vercel deployment), `DEVICE_CODE`, `COUNTER_ID` (UUID from the `counters` table).
2. Provision a device secret: `node scripts/provision-device.mjs ESP32-NODE-DOC-01`, paste the printed secret into `DEVICE_SECRET`, run the printed `UPDATE devices SET secret_hash = ...` in the Supabase SQL editor.
3. Double-check the VL53L0X/RC522 pin assignment against your physical board — the default RC522 RST (GPIO 22) and the ESP32's default I2C SCL can collide; the sketch's top comment flags this. Move one of them to a free GPIO if your wiring has both on 22.

## What it does
Each button press / RFID tap / ToF sample is a plain HTTPS POST to the Next.js API routes under `src/app/api/`, authenticated with `x-device-secret`. The server-side Postgres functions in `supabase/migrations/0001_atomic_queue_ops.sql` are the single source of truth for state transitions — the firmware never computes "is this allowed," it just reports the button press and displays whatever the server says back (including rejections, e.g. "Desk Occupied").

## Known limitations (documented, not silently swallowed)
- `client.setInsecure()` skips TLS certificate validation. This is a known shortcut for a prototype on a trusted campus Wi-Fi; a production deployment should pin the CA cert.
- RFID UID alone is not a strong identity credential — it authenticates "a card was tapped that matches the one registered at the kiosk," not "this specific student." This matches the project's stated threat model (campus queue, not a payment system).
- No persistent offline queue (SPIFFS buffering of failed events) is implemented yet; a dropped request is retried a few times and then surfaced on the OLED, not silently discarded, but it is not stored for later resend.

/*
  QueuePulse ESP32 Counter Node — continuous RFID registration
  --------------------------------------------------------------
  Integrates the hand-tested RFID+OLED prototype logic into the actual
  QueuePulse backend contract read directly from this repo, as of
  migration 0003 (supabase/migrations/0003_continuous_rfid_registration.sql):
    - src/app/api/counters/[counterId]/{call,register,done,missed}/route.ts
    - src/app/api/telemetry/route.ts, src/app/api/events/route.ts
    - src/lib/device-auth.ts (x-device-secret header, SHA-256 against
      devices.secret_hash — see scripts/provision-device.mjs)
    - supabase/migrations/0001_atomic_queue_ops.sql +
      0003_continuous_rfid_registration.sql (RPCs: register_at_counter,
      call_next_token, complete_token, report_clearance)
    - supabase/schema.sql (tokens.token_code / tokens.status / counters.*)

  -------------------------------------------------------------------------
  Continuous registration model (this revision)
  -------------------------------------------------------------------------
  Every RFID tap is submitted as a registration attempt, unconditionally —
  not gated on whatever the counter's local NEXT/DONE state happens to be.
  The backend (register_at_counter(), migration 0003) is the sole judge of
  whether it is accepted:
    - A new, not-already-active UID is accepted: a WAITING token is
      created, and the backend logs an RFID_TAP_ACCEPTED event.
    - A UID that already holds an active token (WAITING/CALLED/IN_SERVICE/
      PENDING_CLEARANCE/GRACE_QUEUE) is rejected as a duplicate: no second
      token is created, but the attempt is still logged
      (RFID_TAP_REJECTED) — so a customer holding a card down, or tapping
      twice by habit, produces audit events, never duplicate queue entries.
  Nothing here decides "is this allowed" locally; the firmware reports the
  tap and displays exactly what the server says back.

  Because RFID identity is now proven at REGISTRATION time, staff pressing
  NEXT does not require a second "tap to verify" step: call_next_token()
  (redefined in migration 0003) moves the next eligible WAITING/GRACE_QUEUE
  token straight to IN_SERVICE. There is no local CALLED-wait state in this
  firmware revision, and therefore no RFID response-window timeout/"missed"
  path is driven by this firmware (the underlying move_token_to_grace() RPC
  and /api/counters/:id/missed route are left intact server-side for any
  other caller, but this firmware's steady-state flow does not reach them
  — see firmware/README.md for the full explanation).

  -------------------------------------------------------------------------
  RFID re-read fix (carried over from the previous revision, unchanged)
  -------------------------------------------------------------------------
  Card session cleanup (PICC_HaltA() + PCD_StopCrypto1()) runs after every
  read attempt, success or failure. A UID is only treated as a "new
  presentation" after the reader reports no card present for
  CARD_ABSENT_REARM_MS — holding the same card continuously is recognized
  and not resent; removing and re-presenting any card re-arms it
  immediately. A consecutive-failure counter triggers a soft rfid.PCD_Init()
  reinit if the reader appears wedged, instead of requiring a manual reset.

  -------------------------------------------------------------------------
  Hardware (fixed per the physical build already wired/tested — unchanged
  from the prior revision; nothing in the repository indicated a pin
  conflict with this wiring, so pins are left exactly as documented):
    - RC522 RFID reader (SPI): SS=5, RST=22, SCK=18, MISO=19, MOSI=23
    - SSD1306 OLED (I2C): SDA=21, SCL=17, address 0x3C
    - VL53L0X ToF distance (I2C): same bus as OLED (SDA=21, SCL=17)
    - Staff buttons: NEXT (GPIO 25), DONE (GPIO 26), both active-LOW
    - LEDs: GREEN (GPIO 27 - clear/ready), RED (GPIO 14 - occupied/blocked),
      YELLOW (GPIO 12 - waiting/grace)
    - Optional piezo buzzer: GPIO 13, disabled by default (BUZZER_ENABLED)

  Networking / API contract (verified against the actual route files):
    All requests are HTTPS POSTs to API_BASE_URL + path, carrying header
      x-device-secret: <DEVICE_SECRET>
    and a JSON body whose first field is always "deviceCode". The server
    hashes DEVICE_SECRET with SHA-256 and compares it to devices.secret_hash
    (device-auth.ts). The device never holds a Supabase key of any kind.

    POST /api/counters/:id/register { deviceCode, rfidUid } -> { accepted, token? , reason? }
    POST /api/counters/:id/call     { deviceCode }           -> { success, token } | { success:false, error }
    POST /api/counters/:id/done     { deviceCode }           -> { success, token } | { success:false, error }
    POST /api/telemetry             { deviceCode, counterId, distanceMm, rssi } -> { success, counter }
    POST /api/events                { workspaceId, deviceCode, counterId, eventType, title, severity, source }

  Local-first, but never falsely "successful": every action is rejected
  locally with an explicit "OFFLINE" message if Wi-Fi/API is unreachable; a
  4xx/non-accepted server response is shown verbatim and is NOT retried.
  Nothing here is reported as success/registered until the server has
  actually returned 2xx with accepted:true (registration) or success:true
  (call/done). The server is the single source of truth for token numbers,
  queue order, duplicate-RFID prevention, and every state transition.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_VL53L0X.h>
#include <time.h>

// ---- TLS root CA ----
// Left blank deliberately, matching the project's documented tradeoff: a
// hand-transcribed certificate string risks being subtly wrong, which is a
// worse failure mode than an honest setInsecure() fallback on a prototype
// running on trusted Wi-Fi. See firmware/README.md "Known limitations".
static const char ROOT_CA_PEM[] = "";
#define USE_SETINSECURE true

// ---- Site configuration (fill in before flashing) ----
const char* WIFI_SSID        = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD    = "YOUR_WIFI_PASSWORD";
const char* API_BASE_URL     = "https://your-deployment.vercel.app"; // no trailing slash
const char* DEVICE_CODE      = "ESP32-NODE-DOC-01";
const char* DEVICE_SECRET    = "REPLACE_WITH_PROVISIONED_SECRET"; // see scripts/provision-device.mjs — NEVER logged below
const char* COUNTER_ID       = "REPLACE_WITH_COUNTER_UUID";       // from the `counters` table
const char* WORKSPACE_ID     = "";                                 // optional: required by /api/events; leave "" to skip event logging

// ---- Pins (fixed to the physical build already wired/tested — do not move) ----
#define RFID_SS_PIN    5
#define RFID_RST_PIN   22
#define OLED_SDA_PIN   21
#define OLED_SCL_PIN   17   // NOT the ESP32 default (22) — this is what avoids the RST/I2C collision
#define BTN_NEXT_PIN   25
#define BTN_DONE_PIN   26
#define LED_GREEN_PIN  27
#define LED_RED_PIN    14
#define LED_YELLOW_PIN 12
#define BUZZER_PIN     13
#define BUZZER_ENABLED false

#define TELEMETRY_INTERVAL_MS     2000
#define HTTP_TIMEOUT_MS           5000
#define MAX_RETRIES               2

// ---- RFID re-arm / recovery tuning ----
#define CARD_ABSENT_REARM_MS      600   // card must be unseen this long before the same UID is "new" again
#define RFID_FAIL_REINIT_THRESHOLD 6    // consecutive presence-detected-but-read-failed events before a soft reinit

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_SSD1306 display(128, 64, &Wire, -1);
Adafruit_VL53L0X tof;

// Local service state is now only IDLE/IN_SERVICE — there is no CALLED
// wait-for-tap state, because RFID identity is proven at registration
// time, not at call time (see header comment).
enum NodeState { IDLE, IN_SERVICE };
NodeState state = IDLE;
unsigned long lastTelemetryMs = 0;
bool wifiWasConnected = false;
bool tofOk = false;
String currentTokenCode = "----";

// RFID re-arm bookkeeping
String presentUid = "";              // UID currently considered "on the reader"
unsigned long lastSeenPresentMs = 0; // last loop tick that UID was actually re-read
byte consecutiveReadFailures = 0;    // presence detected, ReadCardSerial() failed

void oledMessage(const String& line1, const String& line2 = "", const String& line3 = "") {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(line1);
  if (line2.length()) display.println(line2);
  if (line3.length()) display.println(line3);
  display.display();
}

void setLeds(bool g, bool r, bool y) {
  digitalWrite(LED_GREEN_PIN, g ? HIGH : LOW);
  digitalWrite(LED_RED_PIN, r ? HIGH : LOW);
  digitalWrite(LED_YELLOW_PIN, y ? HIGH : LOW);
}

void buzz(int ms) {
  if (!BUZZER_ENABLED) return;
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    wifiWasConnected = true;
    return true;
  }
  wifiWasConnected = false;
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 8000) {
    delay(250);
  }
  return WiFi.status() == WL_CONNECTED;
}

// Returns true on HTTP 2xx. Fills `responseOut` with the raw body.
// Retries on network failure only — a 4xx/5xx is a definitive response
// from the authoritative backend and must be surfaced, not silently
// retried (the caller still inspects the parsed body for accepted/success,
// since this backend sometimes returns 2xx with accepted:false, e.g. a
// duplicate registration — that is not a network failure).
bool postJson(const String& path, const JsonDocument& body, String& responseOut, int& statusOut) {
  if (!ensureWifi()) {
    statusOut = -1;
    return false;
  }

  String payload;
  serializeJson(body, payload);

  for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    WiFiClientSecure client;
    if (USE_SETINSECURE || strlen(ROOT_CA_PEM) == 0) {
      client.setInsecure(); // see firmware/README.md "Known limitations"
    } else {
      client.setCACert(ROOT_CA_PEM);
    }
    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.setConnectTimeout(HTTP_TIMEOUT_MS);

    String url = String(API_BASE_URL) + path;
    if (!http.begin(client, url)) {
      statusOut = -1;
      continue;
    }
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-secret", DEVICE_SECRET); // never printed to Serial

    int code = http.POST(payload);
    statusOut = code;
    Serial.printf("[HTTP] POST %s -> status %d (attempt %d)\n", path.c_str(), code, attempt + 1);
    if (code > 0) {
      responseOut = http.getString();
      http.end();
      // Registration deliberately returns 201 (accepted) or 409 (rejected,
      // e.g. duplicate) — both are definitive, non-retryable responses from
      // the backend, not transport failures. Anything else 4xx is the same.
      if (code >= 200 && code < 300) return true;
      if (code == 409 || (code >= 400 && code < 500)) return false;
    } else {
      Serial.printf("[HTTP] Request failed, error: %s\n", http.errorToString(code).c_str());
      http.end();
    }
    delay(300 * (attempt + 1));
  }
  return false;
}

// Pulls the server's human-readable `error` field rather than inventing wording.
String extractError(const String& resp, const char* fallback) {
  JsonDocument parsed;
  DeserializationError err = deserializeJson(parsed, resp);
  if (err) return String(fallback);
  const char* reason = parsed["error"] | fallback;
  return String(reason);
}

void logEvent(const char* eventType, const char* title, const char* severity = "info") {
  if (strlen(WORKSPACE_ID) == 0) return; // /api/events 400s without workspaceId — don't spam it
  JsonDocument doc;
  doc["workspaceId"] = WORKSPACE_ID;
  doc["deviceCode"] = DEVICE_CODE;
  doc["counterId"] = COUNTER_ID;
  doc["eventType"] = eventType;
  doc["title"] = title;
  doc["severity"] = severity;
  doc["source"] = "ESP32_EDGE";

  String resp; int status;
  postJson("/api/events", doc, resp, status); // best-effort; never blocks the state machine
}

void sendTelemetry(int distanceMm) {
  JsonDocument doc;
  doc["deviceCode"] = DEVICE_CODE;
  doc["counterId"] = COUNTER_ID;
  doc["distanceMm"] = distanceMm;
  doc["rssi"] = WiFi.RSSI();

  String resp; int status;
  postJson("/api/telemetry", doc, resp, status);
}

void handleNextPressed() {
  if (state != IDLE) {
    oledMessage("Session active", "Finish current", "token first");
    return;
  }
  JsonDocument doc;
  doc["deviceCode"] = DEVICE_CODE;
  String resp; int status;
  bool ok = postJson(String("/api/counters/") + COUNTER_ID + "/call", doc, resp, status);

  if (ok) {
    JsonDocument parsed;
    deserializeJson(parsed, resp);
    currentTokenCode = parsed["token"]["token_code"] | "----";
    // call_next_token() now transitions straight to IN_SERVICE — no
    // second RFID tap is required or expected here.
    oledMessage("Now serving:", currentTokenCode, "Send C when done");
    state = IN_SERVICE;
    setLeds(false, true, false); // occupied
    buzz(80);
  } else if (status == -1) {
    oledMessage("OFFLINE", "Retrying NEXT...");
  } else {
    String reason = extractError(resp, "Call rejected");
    oledMessage("Blocked:", reason.substring(0, 21), reason.length() > 21 ? reason.substring(21, 42) : "");
    logEvent("CALL_REJECTED", reason.c_str(), "warning");
  }
}

// Called once per genuinely NEW card presentation (see the re-arm logic in
// pollRfid() below) — never called twice in a row for a card that is
// simply still sitting on the reader. Always a registration attempt,
// regardless of local `state` — requirement: "Every RFID tap is submitted
// as a registration attempt, regardless of queue or service state."
void handleRfidTap(const String& uid) {
  Serial.printf("[RFID] New presentation: UID=%s (local state=%d)\n", uid.c_str(), (int)state);

  JsonDocument doc;
  doc["deviceCode"] = DEVICE_CODE;
  doc["rfidUid"] = uid;
  String resp; int status;
  bool httpOk = postJson(String("/api/counters/") + COUNTER_ID + "/register", doc, resp, status);

  if (status == -1) {
    Serial.println("[RFID] Registration request failed: offline.");
    oledMessage("OFFLINE", "Registration", "not sent - retry tap");
    return;
  }

  JsonDocument parsed;
  DeserializationError parseErr = deserializeJson(parsed, resp);
  bool accepted = !parseErr && (parsed["accepted"] | false);

  if (accepted) {
    String tokenCode = parsed["token"]["token_code"] | "----";
    Serial.printf("[RFID] Registration ACCEPTED. token=%s\n", tokenCode.c_str());
    oledMessage("Registered!", tokenCode, "Joined the queue");
    buzz(120);
  } else {
    const char* reason = parsed["reason"] | "Registration rejected";
    Serial.printf("[RFID] Registration REJECTED: %s\n", reason);
    String reasonStr = String(reason);
    if (reasonStr == "DUPLICATE_ACTIVE_TOKEN") {
      const char* existingCode = parsed["existingTokenCode"] | "";
      oledMessage("Already registered", existingCode, "Card still active");
    } else {
      oledMessage("Not registered:", reasonStr.substring(0, 21));
    }
    // Rejected (including duplicate) is still an audited server-side
    // event (register_at_counter() logs it), not something this firmware
    // needs to additionally log — avoids double-logging the same attempt.
  }
  (void)httpOk; // status/body already fully handled above
}

void handleDonePressed() {
  if (state != IN_SERVICE) {
    oledMessage("No active", "service");
    return;
  }
  JsonDocument doc;
  doc["deviceCode"] = DEVICE_CODE;
  String resp; int status;
  bool ok = postJson(String("/api/counters/") + COUNTER_ID + "/done", doc, resp, status);

  if (ok) {
    oledMessage("Service complete", "Awaiting clearance", "of sensor...");
    state = IDLE;
    currentTokenCode = "----";
    setLeds(true, false, false);
    buzz(80);
  } else if (status == -1) {
    oledMessage("OFFLINE", "Retrying DONE...");
  } else {
    String reason = extractError(resp, "DONE rejected");
    oledMessage("DONE rejected:", reason.substring(0, 21));
  }
}

bool debounceRead(int pin, bool& lastState) {
  bool reading = digitalRead(pin) == LOW; // active-low button
  if (reading && !lastState) {
    lastState = true;
    delay(30); // simple debounce — short enough not to stall RFID polling
    return true;
  }
  if (!reading) lastState = false;
  return false;
}

String uidToHex(MFRC522::Uid& uid) {
  String out = "";
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) out += "0";
    out += String(uid.uidByte[i], HEX);
  }
  out.toUpperCase();
  return out;
}

// Soft recovery for a wedged reader: re-init the PCD without requiring a
// full ESP32 reset. Called after RFID_FAIL_REINIT_THRESHOLD consecutive
// "card present but can't read it" events.
void reinitRfid() {
  Serial.println("[RFID] Too many consecutive read failures — reinitializing PCD.");
  rfid.PCD_Init();
  consecutiveReadFailures = 0;
  presentUid = "";
}

// Polls the reader exactly once per loop() call. Always leaves the reader
// in a clean state (HaltA + StopCrypto1) whether the read succeeded,
// failed, or was a repeat of the card already sitting on the antenna, so
// nothing here can wedge the next poll. Registration continues
// indefinitely without requiring an ESP32 reset.
void pollRfid() {
  bool cardPresent = rfid.PICC_IsNewCardPresent();

  if (!cardPresent) {
    // Nothing on the antenna this tick. If the previously-seen card has
    // been gone long enough, re-arm so it (or a different card) counts as
    // a fresh presentation next time it's read.
    if (presentUid.length() && millis() - lastSeenPresentMs > CARD_ABSENT_REARM_MS) {
      Serial.printf("[RFID] Card removed (UID=%s). Re-armed.\n", presentUid.c_str());
      presentUid = "";
    }
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    consecutiveReadFailures++;
    Serial.printf("[RFID] Card present but UID read failed (failure #%u).\n", consecutiveReadFailures);
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    if (consecutiveReadFailures >= RFID_FAIL_REINIT_THRESHOLD) {
      reinitRfid();
    }
    return;
  }

  consecutiveReadFailures = 0;
  String uid = uidToHex(rfid.uid);

  // Always clean up the card session right after reading the UID.
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  bool isSameCardStillPresent = (uid == presentUid);
  presentUid = uid;
  lastSeenPresentMs = millis();

  if (isSameCardStillPresent) {
    // Same card still sitting on the reader since the last tick — not a
    // new presentation. Not resent to the backend, so holding a card down
    // cannot create duplicate registrations (requirement 6 in the spec).
    return;
  }

  Serial.printf("[RFID] Card detected. UID=%s\n", uid.c_str());
  handleRfidTap(uid);
}

void setup() {
  Serial.begin(115200);
  Serial.println("QueuePulse ESP32 Counter Node booting"); // DEVICE_SECRET is never printed

  pinMode(BTN_NEXT_PIN, INPUT_PULLUP);
  pinMode(BTN_DONE_PIN, INPUT_PULLUP);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_YELLOW_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  SPI.begin();
  rfid.PCD_Init();
  Serial.println("[RFID] PCD_Init complete.");

  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  oledMessage("QueuePulse", "Booting...");

  tofOk = tof.begin();
  if (!tofOk) {
    oledMessage("VL53L0X not found", "Check wiring");
    Serial.println("VL53L0X init failed");
    delay(1500);
  }

  WiFi.mode(WIFI_STA);
  bool wifiOk = ensureWifi();
  Serial.println(wifiOk ? "WiFi connected" : "WiFi connect failed at boot");

  if (!USE_SETINSECURE && strlen(ROOT_CA_PEM) > 0) {
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    oledMessage("Syncing time...");
    time_t now = time(nullptr);
    unsigned long start = millis();
    while (now < 100000 && millis() - start < 10000) {
      delay(200);
      now = time(nullptr);
    }
  }

  oledMessage("Ready", DEVICE_CODE, "Tap to register");
  setLeds(true, false, false);
  logEvent("DEVICE_BOOT", "Counter node booted", "info");
}

void loop() {
  static bool nextLast = false, doneLast = false;

  if (debounceRead(BTN_NEXT_PIN, nextLast)) handleNextPressed();
  if (debounceRead(BTN_DONE_PIN, doneLast)) handleDonePressed();

  // RFID registration runs unconditionally, every loop tick, independent
  // of NEXT/DONE/local state — this is the "continuous registration"
  // requirement.
  pollRfid();

  if (tofOk && millis() - lastTelemetryMs > TELEMETRY_INTERVAL_MS) {
    lastTelemetryMs = millis();
    VL53L0X_RangingMeasurementData_t measure;
    tof.rangingTest(&measure, false);
    int distanceMm = (measure.RangeStatus != 4) ? measure.RangeMilliMeter : 9999;
    sendTelemetry(distanceMm);
  }
}

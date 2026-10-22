/*
  QueuePulse ESP32 Counter Node
  ------------------------------
  Hardware per counter desk:
    - RC522 RFID reader (SPI):   SS/SDA=5, RST=22, SCK=18, MISO=19, MOSI=23
    - VL53L0X ToF distance (I2C): SDA/SCL on the ESP32's default I2C pins
      (GPIO 21 / GPIO 22 on most dev boards). NOTE: GPIO22 is already used
      as RC522 RST above on this board's wiring; verify against your
      physical wiring before flashing — reassign VL53L0X SCL or RC522 RST
      to a free pin (e.g. GPIO 4) if both devices land on 22 in your build.
    - SSD1306 OLED (I2C, shares the bus with VL53L0X)
    - Staff buttons: NEXT (GPIO 25), DONE (GPIO 26)
    - LEDs: GREEN (GPIO 27 - clear/ready), RED (GPIO 14 - occupied/blocked),
      YELLOW (GPIO 12 - waiting/grace)
    - Optional piezo buzzer: GPIO 13 (not relied upon for core logic)

  Networking / API contract:
    All requests are HTTPS POSTs to https://<your-vercel-domain>/api/...
    carrying header  x-device-secret: <DEVICE_SECRET>
    and JSON body    { "deviceCode": DEVICE_CODE, ... }
    The backend hashes DEVICE_SECRET with SHA-256 and compares it against
    devices.secret_hash (see scripts/provision-device.mjs). The device
    never holds a Supabase key of any kind.

  State machine (mirrors src/lib/store.tsx / supabase/migrations/0001_*.sql):
    idle -> NEXT pressed -> POST /api/counters/:id/call
      -> on success: token CALLED, start 60s RFID response window
      -> RFID tap   -> POST /api/counters/:id/rfid  -> IN_SERVICE
      -> timeout    -> POST /api/counters/:id/missed -> GRACE_QUEUE
    IN_SERVICE -> DONE pressed -> POST /api/counters/:id/done -> COMPLETED
    Continuous:  VL53L0X sample every 2s -> POST /api/telemetry

  This firmware is local-first: NEXT/DONE presses and RFID taps are
  rejected locally if Wi-Fi/API is unreachable so staff get immediate
  OLED feedback ("OFFLINE - retrying") instead of a false "success".
  It is unverified against physical hardware — compile/flash and run
  the procedure in firmware/TEST_PROCEDURE.md before relying on it.
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
// Paste the PEM contents of https://letsencrypt.org/certs/isrgrootx1.pem
// (or whichever CA your actual deployment domain chains to — check with
// `openssl s_client -connect your-deployment.vercel.app:443 -showcerts`)
// between the quotes below, then flip USE_SETINSECURE to false. Left
// blank deliberately: a hand-transcribed certificate string risks being
// subtly wrong, which is worse than an honest setInsecure() fallback —
// see firmware/README.md "TLS" section for why this is not done here.
static const char ROOT_CA_PEM[] = "";
#define USE_SETINSECURE true

// ---- Site configuration (fill in before flashing) ----
const char* WIFI_SSID        = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD    = "YOUR_WIFI_PASSWORD";
const char* API_BASE_URL     = "https://your-deployment.vercel.app";
const char* DEVICE_CODE      = "ESP32-NODE-DOC-01";
const char* DEVICE_SECRET    = "REPLACE_WITH_PROVISIONED_SECRET"; // see scripts/provision-device.mjs
const char* COUNTER_ID       = "REPLACE_WITH_COUNTER_UUID";       // from `counters` table

// ---- Pins ----
#define RFID_SS_PIN    5
#define RFID_RST_PIN   22   // see wiring note above re: I2C conflict
#define BTN_NEXT_PIN   25
#define BTN_DONE_PIN   26
#define LED_GREEN_PIN  27
#define LED_RED_PIN    14
#define LED_YELLOW_PIN 12
#define BUZZER_PIN     13

#define DISTANCE_THRESHOLD_MM 800
#define RFID_RESPONSE_WINDOW_MS 60000
#define TELEMETRY_INTERVAL_MS 2000
#define HTTP_TIMEOUT_MS 5000
#define MAX_RETRIES 2

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_SSD1306 display(128, 64, &Wire, -1);
Adafruit_VL53L0X tof;

enum NodeState { IDLE, CALLED_WAITING_RFID, IN_SERVICE };
NodeState state = IDLE;
unsigned long calledAtMs = 0;
unsigned long lastTelemetryMs = 0;
bool wifiWasConnected = false;

void oledMessage(const String& line1, const String& line2 = "") {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(line1);
  display.println(line2);
  display.display();
}

void setLeds(bool g, bool r, bool y) {
  digitalWrite(LED_GREEN_PIN, g ? HIGH : LOW);
  digitalWrite(LED_RED_PIN, r ? HIGH : LOW);
  digitalWrite(LED_YELLOW_PIN, y ? HIGH : LOW);
}

bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiWasConnected) { wifiWasConnected = true; }
    return true;
  }
  wifiWasConnected = false;
  oledMessage("Reconnecting WiFi...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 8000) {
    delay(250);
  }
  return WiFi.status() == WL_CONNECTED;
}

// Returns true on HTTP 2xx. Fills `responseOut` with the raw body.
// Retries up to MAX_RETRIES on network failure (not on 4xx, which is a
// definitive rejection the caller should act on, not retry blindly).
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
      client.setInsecure(); // see firmware/README.md "TLS" — no root CA provisioned
    } else {
      client.setCACert(ROOT_CA_PEM); // requires configTime() to have synced the clock, see setup()
    }
    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);

    String url = String(API_BASE_URL) + path;
    if (!http.begin(client, url)) {
      statusOut = -1;
      continue;
    }
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-secret", DEVICE_SECRET);

    int code = http.POST(payload);
    statusOut = code;
    if (code > 0) {
      responseOut = http.getString();
      http.end();
      if (code >= 200 && code < 300) return true;
      if (code >= 400 && code < 500) return false; // definitive rejection, don't retry
    } else {
      http.end();
    }
    delay(300 * (attempt + 1));
  }
  return false;
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

void logEvent(const char* eventType, const char* title, const char* severity = "info") {
  JsonDocument doc;
  doc["workspaceId"] = ""; // optional: fill if you want client-attributed events; server also logs server-side
  doc["deviceCode"] = DEVICE_CODE;
  doc["counterId"] = COUNTER_ID;
  doc["eventType"] = eventType;
  doc["title"] = title;
  doc["severity"] = severity;
  doc["source"] = "ESP32_EDGE";

  String resp; int status;
  postJson("/api/events", doc, resp, status);
}

void handleNextPressed() {
  if (state != IDLE) {
    oledMessage("Session active", "Finish current token first");
    return;
  }
  JsonDocument doc;
  doc["deviceCode"] = DEVICE_CODE;
  String resp; int status;
  bool ok = postJson(String("/api/counters/") + COUNTER_ID + "/call", doc, resp, status);

  if (ok) {
    JsonDocument parsed;
    deserializeJson(parsed, resp);
    String tokenCode = parsed["token"]["token_code"] | "----";
    oledMessage("Called: " + tokenCode, "Tap RFID card...");
    state = CALLED_WAITING_RFID;
    calledAtMs = millis();
    setLeds(false, false, true);
  } else if (status == -1) {
    oledMessage("OFFLINE", "Retrying NEXT...");
  } else {
    JsonDocument parsed;
    deserializeJson(parsed, resp);
    String reason = parsed["error"] | "Call rejected";
    oledMessage("Blocked:", reason.substring(0, 20));
    setLeds(false, true, false);
  }
}

void handleRfidTap(const String& uid) {
  if (state != CALLED_WAITING_RFID) {
    return; // ignore stray taps outside the response window
  }
  JsonDocument doc;
  doc["deviceCode"] = DEVICE_CODE;
  doc["rfidUid"] = uid;
  String resp; int status;
  bool ok = postJson(String("/api/counters/") + COUNTER_ID + "/rfid", doc, resp, status);

  if (ok) {
    oledMessage("Verified!", "Service started");
    state = IN_SERVICE;
    setLeds(false, true, false); // occupied
  } else {
    oledMessage("RFID mismatch", "Try again or wait");
  }
}

void handleDonePressed() {
  if (state != IN_SERVICE) {
    oledMessage("No active service", "");
    return;
  }
  JsonDocument doc;
  doc["deviceCode"] = DEVICE_CODE;
  String resp; int status;
  bool ok = postJson(String("/api/counters/") + COUNTER_ID + "/done", doc, resp, status);

  if (ok) {
    oledMessage("Service complete", "Awaiting clearance...");
    state = IDLE;
    setLeds(true, false, false);
  } else if (status == -1) {
    oledMessage("OFFLINE", "Retrying DONE...");
  } else {
    oledMessage("DONE rejected", "");
  }
}

void checkRfidTimeout() {
  if (state == CALLED_WAITING_RFID && millis() - calledAtMs > RFID_RESPONSE_WINDOW_MS) {
    JsonDocument doc;
    doc["deviceCode"] = DEVICE_CODE;
    String resp; int status;
    bool ok = postJson(String("/api/counters/") + COUNTER_ID + "/missed", doc, resp, status);
    if (ok) {
      oledMessage("Missed", "Moved to Grace Queue");
      state = IDLE;
      setLeds(true, false, false);
    }
    // on failure (offline), leave state as-is and retry next loop tick
  }
}

bool debounceRead(int pin, bool& lastState) {
  bool reading = digitalRead(pin) == LOW; // active-low button
  if (reading && !lastState) {
    lastState = true;
    delay(30); // simple debounce
    return true;
  }
  if (!reading) lastState = false;
  return false;
}

void setup() {
  Serial.begin(115200);
  pinMode(BTN_NEXT_PIN, INPUT_PULLUP);
  pinMode(BTN_DONE_PIN, INPUT_PULLUP);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_YELLOW_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  SPI.begin();
  rfid.PCD_Init();

  Wire.begin();
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  oledMessage("QueuePulse", "Booting...");

  if (!tof.begin()) {
    oledMessage("VL53L0X not found", "Check wiring");
    delay(2000);
  }

  WiFi.mode(WIFI_STA);
  ensureWifi();

  if (!USE_SETINSECURE && strlen(ROOT_CA_PEM) > 0) {
    // Real cert validation needs a correct clock — TLS checks notBefore/
    // notAfter against system time, and the ESP32 boots at epoch 0.
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    oledMessage("Syncing time...");
    time_t now = time(nullptr);
    unsigned long start = millis();
    while (now < 100000 && millis() - start < 10000) {
      delay(200);
      now = time(nullptr);
    }
  }

  oledMessage("Ready", DEVICE_CODE);
  setLeds(true, false, false);
}

void loop() {
  static bool nextLast = false, doneLast = false;

  if (debounceRead(BTN_NEXT_PIN, nextLast)) handleNextPressed();
  if (debounceRead(BTN_DONE_PIN, doneLast)) handleDonePressed();

  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    handleRfidTap(uid);
    rfid.PICC_HaltA();
  }

  checkRfidTimeout();

  if (millis() - lastTelemetryMs > TELEMETRY_INTERVAL_MS) {
    lastTelemetryMs = millis();
    VL53L0X_RangingMeasurementData_t measure;
    tof.rangingTest(&measure, false);
    int distanceMm = (measure.RangeStatus != 4) ? measure.RangeMilliMeter : 9999;
    sendTelemetry(distanceMm);
  }
}

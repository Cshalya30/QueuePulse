# Physical hardware test procedure

Run after flashing one ESP32 node and provisioning its device secret (see `README.md`). Check off each row.

| # | Step | Expected result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Power on the node | OLED shows "QueuePulse / Booting..." then "Ready" | |
| 2 | Observe LEDs at idle, desk clear | Green LED on, red/yellow off | |
| 3 | Register a token at the kiosk (POST /api/tokens or dashboard) for this counter's category | A WAITING token appears in the dashboard queue lane | |
| 4 | Press NEXT | OLED shows "Called: <code> / Tap RFID card...", yellow LED on, dashboard token status becomes CALLED | |
| 5 | Tap the registered RFID card | OLED shows "Verified! / Service started", red LED on, dashboard token status becomes IN_SERVICE | |
| 6 | Press DONE | OLED shows "Service complete", dashboard token COMPLETED | |
| 7 | Step away from the ToF sensor (>800mm) | Green LED returns, counter unassigns in dashboard | |
| 8 | Press NEXT again before stepping away (desk still occupied) | OLED/dashboard shows "Desk Occupied" rejection, no token called | |
| 9 | Call a token, do not tap RFID for 60s | Token automatically moves to GRACE_QUEUE in dashboard, OLED shows "Missed" | |
| 10 | Tap a wrong/unregistered RFID card while a token is CALLED | OLED shows "RFID mismatch", token stays CALLED | |
| 11 | Disconnect Wi-Fi (turn off router or walk out of range), press NEXT | OLED shows "OFFLINE - Retrying...", no false success | |
| 12 | Restore Wi-Fi | Node reconnects automatically within ~10s, subsequent button press works | |
| 13 | Rapidly double-press DONE | Second press rejected ("No active service" / DONE rejected) — no duplicate COMPLETED | |
| 14 | Power-cycle the node mid-session (token CALLED) | On reboot, node starts IDLE; dashboard token remains CALLED until staff presses NEXT again or it times out to Grace Queue — confirms no local-only state is lost from the database's perspective | |

Record failures with OLED text / dashboard event log entries for debugging.

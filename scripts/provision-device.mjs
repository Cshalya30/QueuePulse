// Generates a random device secret, prints the SHA-256 hash to store in
// `devices.secret_hash`, and prints the plaintext to flash onto the ESP32.
// Run: node scripts/provision-device.mjs <DEVICE_CODE>
//
// This never talks to Supabase directly (no service-role key needed here).
// Paste the printed UPDATE statement into the Supabase SQL editor yourself.
import crypto from "crypto";

const deviceCode = process.argv[2];
if (!deviceCode) {
  console.error("Usage: node scripts/provision-device.mjs <DEVICE_CODE>");
  process.exit(1);
}

const secret = crypto.randomBytes(24).toString("hex");
const hash = crypto.createHash("sha256").update(secret).digest("hex");

console.log(`Device code: ${deviceCode}`);
console.log(`\nPlaintext secret (flash this into DEVICE_SECRET in the .ino sketch — save it now, it is not recoverable from the hash):\n${secret}`);
console.log(`\nRun this in the Supabase SQL editor:\nUPDATE devices SET secret_hash = '${hash}' WHERE device_code = '${deviceCode}';`);

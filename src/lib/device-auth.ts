import { NextRequest } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ESP32 nodes authenticate with a per-device shared secret sent in the
// `x-device-secret` header. We store only its SHA-256 hash in `devices.secret_hash`,
// so a leaked database dump does not hand out usable device credentials.
// This is a pragmatic HMAC-less scheme appropriate for a closed campus network;
// it is NOT equivalent to mutual TLS. Document this limitation to users.
export async function authenticateDevice(
  req: NextRequest,
  deviceCode: string
): Promise<{ ok: true } | { ok: false; status: number; reason: string }> {
  if (!supabaseAdmin) {
    return { ok: false, status: 500, reason: "Server not configured." };
  }
  const providedSecret = req.headers.get("x-device-secret");
  if (!providedSecret) {
    return { ok: false, status: 401, reason: "Missing x-device-secret header." };
  }

  const { data: device, error } = await supabaseAdmin
    .from("devices")
    .select("id, secret_hash")
    .eq("device_code", deviceCode)
    .maybeSingle();

  if (error || !device) {
    return { ok: false, status: 404, reason: "Unknown device." };
  }
  if (!device.secret_hash) {
    return { ok: false, status: 401, reason: "Device has no provisioned secret." };
  }

  const providedHash = crypto.createHash("sha256").update(providedSecret).digest("hex");
  const a = Buffer.from(providedHash);
  const b = Buffer.from(device.secret_hash);
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!match) {
    return { ok: false, status: 401, reason: "Invalid device secret." };
  }
  return { ok: true };
}

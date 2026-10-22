import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured, mapPgError } from "@/lib/supabase-admin";
import { authenticateDevice } from "@/lib/device-auth";

// ToF (VL53L0X) distance ingestion from ESP32 edge nodes. Requires device
// authentication. Applies the reading via report_clearance() so occupancy
// state and counter-token unassignment stay consistent and race-free, then
// records the raw sample into counter_telemetry for history/graphs.
export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured on server." }, { status: 503 });
  }

  let body: {
    deviceCode?: string;
    counterId?: string;
    distanceMm?: number;
    queueLength?: number;
    rssi?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { deviceCode, counterId, distanceMm, queueLength, rssi } = body;
  if (!deviceCode || !counterId || distanceMm === undefined) {
    return NextResponse.json(
      { error: "Missing required telemetry fields: deviceCode, counterId, distanceMm" },
      { status: 400 }
    );
  }
  if (typeof distanceMm !== "number" || distanceMm < 0 || distanceMm > 8000) {
    return NextResponse.json({ error: "distanceMm out of sensor range" }, { status: 400 });
  }

  const auth = await authenticateDevice(req, deviceCode);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  const { data: counter, error: rpcError } = await supabaseAdmin.rpc("report_clearance", {
    p_counter_id: counterId,
    p_distance_mm: Math.round(distanceMm),
  });

  if (rpcError) {
    const { status, reason } = mapPgError(rpcError);
    return NextResponse.json({ error: reason }, { status });
  }

  const { data: device } = await supabaseAdmin
    .from("devices")
    .select("id")
    .eq("device_code", deviceCode)
    .maybeSingle();

  await supabaseAdmin.from("counter_telemetry").insert({
    device_id: device?.id ?? null,
    counter_id: counterId,
    distance_mm: Math.round(distanceMm),
    occupancy_state: counter.occupancy_state,
    queue_length: queueLength ?? 0,
    current_token_id: counter.current_token_id,
  });

  if (device?.id) {
    await supabaseAdmin
      .from("devices")
      .update({ last_seen_at: new Date().toISOString(), online: true, wifi_signal: rssi ?? -55 })
      .eq("id", device.id);
  }

  return NextResponse.json({ success: true, counter });
}

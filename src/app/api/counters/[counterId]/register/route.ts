import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { authenticateDevice } from "@/lib/device-auth";

// Continuous RFID registration (migration 0003). Every tap at the
// counter's reader is submitted here as a registration attempt, regardless
// of the counter's current queue/service state. register_at_counter() is
// atomic: it always writes an audit row to `events` (accepted or
// rejected) in the same transaction as the token insert/rejection, so a
// repeated tap can create additional audit events but never a duplicate
// active token. Only an accepted attempt creates a WAITING token.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ counterId: string }> }
) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured on server." }, { status: 503 });
  }
  const { counterId } = await params;

  let body: { deviceCode?: string; rfidUid?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!body.deviceCode || !body.rfidUid) {
    return NextResponse.json({ error: "deviceCode and rfidUid required" }, { status: 400 });
  }
  const auth = await authenticateDevice(req, body.deviceCode);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  const { data: device } = await supabaseAdmin
    .from("devices")
    .select("id")
    .eq("device_code", body.deviceCode)
    .maybeSingle();

  const { data, error } = await supabaseAdmin.rpc("register_at_counter", {
    p_counter_id: counterId,
    p_device_id: device?.id ?? null,
    p_rfid_uid: body.rfidUid,
  });

  if (error) {
    // register_at_counter() itself only ever raises for a missing counter
    // (COUNTER_NOT_FOUND) — every other rejection path returns a normal
    // {accepted:false,...} value so the attempt still gets logged.
    return NextResponse.json({ accepted: false, error: error.message }, { status: 500 });
  }

  const accepted = Boolean(data?.accepted);
  return NextResponse.json(data, { status: accepted ? 201 : 409 });
}

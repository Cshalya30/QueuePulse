import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured, mapPgError } from "@/lib/supabase-admin";
import { authenticateDevice } from "@/lib/device-auth";

// RC522 RFID tap at the counter desk. Verifies the UID against the
// token's registered UID (set at kiosk registration) via verify_token_rfid().
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

  const { data, error } = await supabaseAdmin.rpc("verify_token_rfid", {
    p_counter_id: counterId,
    p_rfid_uid: body.rfidUid,
  });

  if (error) {
    const { status, reason } = mapPgError(error);
    return NextResponse.json({ success: false, error: reason }, { status });
  }

  return NextResponse.json({ success: true, token: data });
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured, mapPgError } from "@/lib/supabase-admin";
import { authenticateDevice } from "@/lib/device-auth";

// Called by the ESP32 node itself after its local 60s RFID response-window
// timer expires on a CALLED token with no tap. Moves the token to the
// Grace Queue via move_token_to_grace().
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ counterId: string }> }
) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured on server." }, { status: 503 });
  }
  const { counterId } = await params;

  let body: { deviceCode?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!body.deviceCode) {
    return NextResponse.json({ error: "deviceCode required" }, { status: 400 });
  }
  const auth = await authenticateDevice(req, body.deviceCode);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  const { data, error } = await supabaseAdmin.rpc("move_token_to_grace", {
    p_counter_id: counterId,
  });

  if (error) {
    const { status, reason } = mapPgError(error);
    return NextResponse.json({ success: false, error: reason }, { status });
  }

  return NextResponse.json({ success: true, token: data });
}

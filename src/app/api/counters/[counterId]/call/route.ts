import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured, mapPgError } from "@/lib/supabase-admin";
import { authenticateDevice } from "@/lib/device-auth";

// Staff NEXT button. The ESP32 node authenticates with its device secret;
// the actual claim is atomic inside call_next_token() (row-locked), so two
// rapid button presses or a retried request cannot both claim a token.
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

  const { data, error } = await supabaseAdmin.rpc("call_next_token", {
    p_counter_id: counterId,
  });

  if (error) {
    const { status, reason } = mapPgError(error);
    return NextResponse.json({ success: false, error: reason }, { status });
  }

  return NextResponse.json({ success: true, token: data });
}

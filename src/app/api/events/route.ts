import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { authenticateDevice } from "@/lib/device-auth";

// Audit/event ingestion from ESP32 edge nodes or operator UI actions.
// Writes a row into `events`; never mutates token/counter state itself
// (state transitions go through the dedicated counter-action routes so
// that the authoritative state machine lives in one place).
export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured on server." }, { status: 503 });
  }

  let body: {
    workspaceId?: string;
    deviceCode?: string;
    counterId?: string;
    tokenId?: string;
    eventType?: string;
    title?: string;
    description?: string;
    severity?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { workspaceId, deviceCode, counterId, tokenId, eventType, title, description, severity, source, metadata } = body;

  if (!workspaceId || !eventType || !title) {
    return NextResponse.json(
      { error: "Missing required event fields: workspaceId, eventType, title" },
      { status: 400 }
    );
  }

  // Hardware-sourced events must authenticate as the claimed device.
  if (source === "ESP32_EDGE") {
    if (!deviceCode) {
      return NextResponse.json({ error: "deviceCode required for ESP32_EDGE events" }, { status: 400 });
    }
    const auth = await authenticateDevice(req, deviceCode);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.reason }, { status: auth.status });
    }
  }

  let deviceId: string | null = null;
  if (deviceCode) {
    const { data: device } = await supabaseAdmin
      .from("devices")
      .select("id")
      .eq("device_code", deviceCode)
      .maybeSingle();
    deviceId = device?.id ?? null;
  }

  const { data, error } = await supabaseAdmin
    .from("events")
    .insert({
      workspace_id: workspaceId,
      device_id: deviceId,
      counter_id: counterId ?? null,
      token_id: tokenId ?? null,
      event_type: eventType,
      title,
      description: description ?? null,
      severity: severity ?? "info",
      source: source ?? "OPERATOR_ACTION",
      metadata: metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, event: data }, { status: 201 });
}

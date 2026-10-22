import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured, mapPgError } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured on server." }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const status = searchParams.get("status");

  let query = supabaseAdmin.from("tokens").select("*").order("created_at", { ascending: true });
  if (workspaceId) query = query.eq("workspace_id", workspaceId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tokens: data });
}

// Registers a new token for a service category (kiosk RFID tap + category button).
// Delegates to the register_token() Postgres function, which atomically
// allocates the next sequential token number per category and rejects a
// second active registration for the same RFID UID.
export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured on server." }, { status: 503 });
  }

  let body: { workspaceId?: string; serviceCategoryId?: string; rfidUid?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { workspaceId, serviceCategoryId, rfidUid } = body;
  if (!workspaceId || !serviceCategoryId) {
    return NextResponse.json(
      { error: "Missing required fields: workspaceId, serviceCategoryId" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin.rpc("register_token", {
    p_workspace_id: workspaceId,
    p_service_category_id: serviceCategoryId,
    p_rfid_uid: rfidUid ?? null,
  });

  if (error) {
    const { status, reason } = mapPgError(error);
    return NextResponse.json({ error: reason }, { status });
  }

  return NextResponse.json({ success: true, token: data }, { status: 201 });
}

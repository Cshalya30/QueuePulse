import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key. This bypasses RLS,
// so it must NEVER be imported from a "use client" file or exposed to the browser.
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseAdminConfigured = Boolean(url && serviceKey);

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;

// Maps a Postgres error raised with `RAISE EXCEPTION '<CODE>'` (see migration
// 0001) to an HTTP status + human-readable reason.
export const PG_ERROR_MAP: Record<string, { status: number; reason: string }> = {
  DUPLICATE_ACTIVE_TOKEN: { status: 409, reason: "This card already has an active token." },
  UNKNOWN_CATEGORY: { status: 400, reason: "Unknown service category." },
  COUNTER_NOT_FOUND: { status: 404, reason: "Counter not found." },
  DESK_OCCUPIED: { status: 409, reason: "Desk Occupied — counter must be clear before calling the next token." },
  ACTIVE_SESSION_EXISTS: { status: 409, reason: "Active session already in progress on this counter." },
  QUEUE_EMPTY: { status: 404, reason: "No waiting tokens available in queue." },
  NO_ACTIVE_TOKEN: { status: 409, reason: "Counter has no active token." },
  TOKEN_NOT_CALLED: { status: 409, reason: "Token is not in CALLED state." },
  RFID_MISMATCH: { status: 401, reason: "RFID UID mismatch." },
  TOKEN_NOT_IN_SERVICE: { status: 409, reason: "Token is not IN_SERVICE." },
};

export function mapPgError(err: unknown): { status: number; reason: string } {
  const message = err instanceof Error ? err.message : String(err);
  for (const code of Object.keys(PG_ERROR_MAP)) {
    if (message.includes(code)) return PG_ERROR_MAP[code];
  }
  return { status: 500, reason: "Internal error." };
}

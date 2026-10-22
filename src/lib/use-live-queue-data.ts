"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Workspace,
  ServiceCategory,
  Counter,
  Device,
  Token,
  OperationalEvent,
  CounterTelemetry,
} from "@/types/queuepulse";

// Maps a snake_case Supabase row to the camelCase shapes used by the UI.
function mapCounter(r: Record<string, unknown>): Counter {
  return {
    id: r.id as string,
    workspaceId: r.workspace_id as string,
    code: r.code as string,
    name: r.name as string,
    serviceCategoryId: r.service_category_id as string,
    deviceId: r.device_id as string,
    status: r.status as Counter["status"],
    occupancyState: r.occupancy_state as Counter["occupancyState"],
    currentDistanceMm: r.current_distance_mm as number,
    distanceThresholdMm: r.distance_threshold_mm as number,
    currentTokenId: r.current_token_id as string | null,
    staffName: r.staff_name as string | undefined,
    queueLength: 0,
    lastEventTime: (r.created_at as string) ?? new Date().toISOString(),
    isDemo: false,
  };
}
function mapToken(r: Record<string, unknown>): Token {
  return {
    id: r.id as string,
    workspaceId: r.workspace_id as string,
    counterId: r.counter_id as string | null,
    serviceCategoryId: r.service_category_id as string,
    tokenCode: r.token_code as string,
    status: r.status as Token["status" extends never ? never : "status"] as Token["status"],
    priority: r.priority as Token["priority"],
    createdAt: r.created_at as string,
    calledAt: r.called_at as string | null,
    serviceStartedAt: r.service_started_at as string | null,
    serviceCompletedAt: r.service_completed_at as string | null,
    missedAt: r.missed_at as string | null,
    movedToGraceAt: r.moved_to_grace_at as string | null,
    waitingSeconds: r.waiting_seconds as number | undefined,
    serviceSeconds: r.service_seconds as number | undefined,
    rfidSessionUid: r.rfid_session_uid as string | null,
    rfidVerified: r.rfid_verified as boolean | undefined,
    notes: r.notes as string | undefined,
    isDemo: false,
  };
}
function mapDevice(r: Record<string, unknown>): Device {
  return {
    id: r.id as string,
    workspaceId: r.workspace_id as string,
    deviceCode: r.device_code as string,
    counterId: "",
    firmwareVersion: r.firmware_version as string,
    lastSeenAt: r.last_seen_at as string,
    online: r.online as boolean,
    wifiSignalRssi: r.wifi_signal as number,
    uptimeSeconds: r.uptime_seconds as number,
    isDemo: false,
  };
}
function mapEvent(r: Record<string, unknown>): OperationalEvent {
  return {
    id: r.id as string,
    workspaceId: r.workspace_id as string,
    deviceId: r.device_id as string | null,
    counterId: r.counter_id as string | null,
    tokenId: r.token_id as string | null,
    eventType: r.event_type as OperationalEvent["eventType"],
    eventTimestamp: r.event_timestamp as string,
    source: r.source as OperationalEvent["source"],
    severity: r.severity as OperationalEvent["severity"],
    title: r.title as string,
    description: r.description as string,
    metadata: r.metadata as Record<string, unknown>,
    isDemo: false,
  };
}
function mapTelemetry(r: Record<string, unknown>): CounterTelemetry {
  return {
    id: r.id as string,
    deviceId: r.device_id as string,
    counterId: r.counter_id as string,
    distanceMm: r.distance_mm as number,
    occupancyState: r.occupancy_state as CounterTelemetry["occupancyState"],
    queueLength: r.queue_length as number,
    currentTokenId: r.current_token_id as string | null,
    rssi: -55,
    recordedAt: r.recorded_at as string,
    isDemo: false,
  };
}
function mapCategory(r: Record<string, unknown>): ServiceCategory {
  return {
    id: r.id as string,
    workspaceId: r.workspace_id as string,
    code: r.code as string,
    name: r.name as string,
    description: (r.description as string) ?? "",
    prefix: r.prefix as string,
    slaTargetSeconds: r.sla_target_seconds as number,
    color: r.color as string,
    active: r.active as boolean,
  };
}
function mapWorkspace(r: Record<string, unknown>): Workspace {
  return {
    id: r.id as string,
    name: r.name as string,
    location: r.location as string,
    timezone: r.timezone as string,
    createdAt: r.created_at as string,
  };
}

interface LiveQueueData {
  loading: boolean;
  error: string | null;
  workspace: Workspace | null;
  categories: ServiceCategory[];
  counters: Counter[];
  devices: Device[];
  tokens: Token[];
  events: OperationalEvent[];
  telemetryHistory: CounterTelemetry[];
}

// Fetches real Supabase-backed queue state and subscribes to Realtime
// updates for counters/tokens/events/telemetry so Live Mode reflects the
// authoritative database without polling.
export function useLiveQueueData(enabled: boolean): LiveQueueData {
  const [state, setState] = useState<LiveQueueData>({
    loading: true,
    error: null,
    workspace: null,
    categories: [],
    counters: [],
    devices: [],
    tokens: [],
    events: [],
    telemetryHistory: [],
  });

  useEffect(() => {
    if (!enabled) return;
    if (!isSupabaseConfigured || !supabase) {
      setState((s) => ({ ...s, loading: false, error: "Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)." }));
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      const [ws, cats, counters, devices, tokens, events, telemetry] = await Promise.all([
        supabase!.from("workspaces").select("*").limit(1).maybeSingle(),
        supabase!.from("service_categories").select("*"),
        supabase!.from("counters").select("*"),
        // Explicit column list, not select("*"): migration 0001 grants anon
        // SELECT on only this subset (secret_hash is withheld), and Postgres
        // rejects the whole query if any requested column is unauthorized —
        // select("*") would 403 this call and, via the firstError check
        // below, take down the entire Live Mode fetch with it.
        supabase!
          .from("devices")
          .select("id, workspace_id, device_code, firmware_version, last_seen_at, online, wifi_signal, uptime_seconds, created_at"),
        supabase!.from("tokens").select("*").order("created_at", { ascending: true }),
        supabase!.from("events").select("*").order("event_timestamp", { ascending: false }).limit(100),
        supabase!.from("counter_telemetry").select("*").order("recorded_at", { ascending: false }).limit(50),
      ]);

      if (cancelled) return;

      const firstError = [ws, cats, counters, devices, tokens, events, telemetry].find((r) => r.error)?.error;
      if (firstError) {
        setState((s) => ({ ...s, loading: false, error: firstError.message }));
        return;
      }

      setState({
        loading: false,
        error: null,
        workspace: ws.data ? mapWorkspace(ws.data) : null,
        categories: (cats.data ?? []).map(mapCategory),
        counters: (counters.data ?? []).map(mapCounter),
        devices: (devices.data ?? []).map(mapDevice),
        tokens: (tokens.data ?? []).map(mapToken),
        events: (events.data ?? []).map(mapEvent),
        telemetryHistory: (telemetry.data ?? []).map(mapTelemetry),
      });
    }

    fetchAll();

    const channel = supabase
      .channel("queuepulse-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "counters" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "counter_telemetry" }, fetchAll)
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, [enabled]);

  return state;
}

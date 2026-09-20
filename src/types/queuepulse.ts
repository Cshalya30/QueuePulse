export type TokenStatus =
  | "WAITING"
  | "CALLED"
  | "IN_SERVICE"
  | "PENDING_CLEARANCE"
  | "COMPLETED"
  | "MISSED"
  | "GRACE_QUEUE"
  | "CANCELLED";

export type OccupancyState = "CLEAR" | "OCCUPIED" | "OBSTRUCTED" | "UNKNOWN";

export type DeviceState = "ONLINE" | "OFFLINE" | "STALE" | "DEGRADED";

export type EventSeverity = "info" | "success" | "warning" | "critical";

export type EventSource = "ESP32_EDGE" | "CLOUD_SYNC" | "OPERATOR_ACTION" | "HARDWARE_SIMULATOR";

export interface Workspace {
  id: string;
  name: string;
  location: string;
  timezone: string;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  workspaceId: string;
  code: string; // e.g. "DOC", "ACC", "ENQ"
  name: string; // e.g. "Documents & Transcripts"
  description: string;
  prefix: string;
  slaTargetSeconds: number; // e.g. 900 (15 min)
  color: string;
  active: boolean;
}

export interface Device {
  id: string;
  workspaceId: string;
  deviceCode: string; // e.g. "ESP32-NODE-DOC-01"
  counterId: string;
  firmwareVersion: string;
  lastSeenAt: string;
  online: boolean;
  wifiSignalRssi: number; // e.g. -54 dBm
  ipAddress?: string;
  uptimeSeconds: number;
  batteryBackupPercent?: number;
  isDemo?: boolean;
}

export interface Counter {
  id: string;
  workspaceId: string;
  code: string; // e.g. "DOC-01"
  name: string; // e.g. "Counter 1 - Records"
  serviceCategoryId: string;
  deviceId: string;
  status: "ACTIVE" | "PAUSED" | "MAINTENANCE" | "OFFLINE";
  occupancyState: OccupancyState;
  currentDistanceMm: number;
  distanceThresholdMm: number; // Clearance threshold (e.g. 800mm)
  currentTokenId?: string | null;
  staffName?: string;
  queueLength: number;
  lastEventTime: string;
  isDemo?: boolean;
}

export interface Token {
  id: string;
  workspaceId: string;
  counterId?: string | null;
  serviceCategoryId: string;
  tokenCode: string; // e.g. "DOC-024"
  status: TokenStatus;
  priority: "NORMAL" | "GRACE" | "VIP";
  createdAt: string;
  calledAt?: string | null;
  serviceStartedAt?: string | null;
  serviceCompletedAt?: string | null;
  missedAt?: string | null;
  movedToGraceAt?: string | null;
  waitingSeconds?: number;
  serviceSeconds?: number;
  rfidSessionUid?: string | null;
  rfidVerified?: boolean;
  notes?: string;
  isDemo?: boolean;
}

export interface OperationalEvent {
  id: string;
  workspaceId: string;
  deviceId?: string | null;
  counterId?: string | null;
  tokenId?: string | null;
  eventType:
    | "TOKEN_CREATED"
    | "TOKEN_CALLED"
    | "RFID_VERIFIED"
    | "RFID_REJECTED"
    | "SERVICE_STARTED"
    | "SERVICE_COMPLETED"
    | "COUNTER_OCCUPIED"
    | "COUNTER_CLEARED"
    | "TOKEN_MISSED"
    | "TOKEN_MOVED_TO_GRACE"
    | "DEVICE_CONNECTED"
    | "DEVICE_DISCONNECTED"
    | "CLOUD_SYNC_DELAYED"
    | "CLOUD_SYNC_RESTORED"
    | "OPERATOR_OVERRIDE";
  eventTimestamp: string;
  source: EventSource;
  severity: EventSeverity;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  isDemo?: boolean;
}

export interface CounterTelemetry {
  id: string;
  deviceId: string;
  counterId: string;
  distanceMm: number;
  occupancyState: OccupancyState;
  queueLength: number;
  currentTokenId?: string | null;
  rssi: number;
  recordedAt: string;
  isDemo?: boolean;
}

export interface QueuePulseState {
  workspace: Workspace;
  categories: ServiceCategory[];
  counters: Counter[];
  devices: Device[];
  tokens: Token[];
  events: OperationalEvent[];
  telemetryHistory: CounterTelemetry[];
  selectedCounterId: string;
  selectedTokenId: string | null;
  isDemoMode: boolean;
  demoScenarioStep: number;
  activeScenarioId: string | null;
  isHardwareSimulating: boolean;
  networkOnline: boolean;
  lastSyncTimestamp: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  stepsCount: number;
  currentStep: number;
  steps: {
    index: number;
    title: string;
    narrative: string;
    actionLabel: string;
    expectedState: string;
    highlights: string[];
  }[];
}

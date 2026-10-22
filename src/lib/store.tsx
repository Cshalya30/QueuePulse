"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Workspace,
  ServiceCategory,
  Counter,
  Device,
  Token,
  OperationalEvent,
  CounterTelemetry,
  OccupancyState,
  TokenStatus,
} from "@/types/queuepulse";
import {
  INITIAL_WORKSPACE,
  INITIAL_CATEGORIES,
  INITIAL_COUNTERS,
  INITIAL_DEVICES,
  INITIAL_TOKENS,
  INITIAL_EVENTS,
  INITIAL_TELEMETRY_LOGS,
  DEMO_SCENARIOS,
} from "@/lib/mock-data";
import { useLiveQueueData } from "@/lib/use-live-queue-data";

interface QueuePulseContextType {
  workspace: Workspace;
  categories: ServiceCategory[];
  counters: Counter[];
  devices: Device[];
  tokens: Token[];
  events: OperationalEvent[];
  telemetryHistory: CounterTelemetry[];
  selectedCounterId: string;
  selectedTokenId: string | null;
  setSelectedCounterId: (id: string) => void;
  setSelectedTokenId: (id: string | null) => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  activeScenarioId: string | null;
  activeScenarioStep: number;
  startScenario: (scenarioId: string) => void;
  nextScenarioStep: () => void;
  resetScenario: () => void;
  generateToken: (categoryId: string) => Token;
  callNextToken: (counterId: string) => { success: boolean; reason?: string };
  triggerServiceDone: (counterId: string) => { success: boolean; reason?: string };
  triggerClearance: (counterId: string, distanceMm: number) => void;
  triggerRfidTap: (counterId: string, customUid?: string, match?: boolean) => { success: boolean; reason?: string };
  triggerMissedToken: (counterId: string) => { success: boolean; reason?: string };
  moveTokenToGrace: (tokenId: string) => void;
  toggleDeviceOnline: (deviceId: string) => void;
  resetToInitialState: () => void;
  isCounterCallBlocked: (counterId: string) => { blocked: boolean; reason?: string };
  activeCounter: Counter | undefined;
  activeToken: Token | undefined;
  metrics: {
    activeQueuesCount: number;
    totalWaiting: number;
    avgWaitSeconds: number;
    servedTodayCount: number;
    missedRatePercent: number;
    slaCompliancePercent: number;
    graceQueueCount: number;
  };
}

const QueuePulseContext = createContext<QueuePulseContextType | null>(null);

export const QueuePulseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workspace] = useState<Workspace>(INITIAL_WORKSPACE);
  const [categories, setCategories] = useState<ServiceCategory[]>(INITIAL_CATEGORIES);
  const [counters, setCounters] = useState<Counter[]>(INITIAL_COUNTERS);
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [tokens, setTokens] = useState<Token[]>(INITIAL_TOKENS);
  const [events, setEvents] = useState<OperationalEvent[]>(INITIAL_EVENTS);
  const [telemetryHistory, setTelemetryHistory] = useState<CounterTelemetry[]>(
    INITIAL_TELEMETRY_LOGS
  );

  const [selectedCounterId, setSelectedCounterId] = useState<string>("cnt-doc-01");
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [activeScenarioStep, setActiveScenarioStep] = useState<number>(1);

  // Live Mode reads the authoritative Supabase database (with Realtime
  // updates) instead of the in-memory mock arrays below. Demo Mode keeps
  // the existing hardware-simulator behavior untouched.
  const live = useLiveQueueData(!isDemoMode);
  const effectiveCategories = !isDemoMode && !live.error ? live.categories : categories;
  const effectiveCounters = !isDemoMode && !live.error ? live.counters : counters;
  const effectiveDevices = !isDemoMode && !live.error ? live.devices : devices;
  const effectiveTokens = !isDemoMode && !live.error ? live.tokens : tokens;
  const effectiveEvents = !isDemoMode && !live.error ? live.events : events;
  const effectiveTelemetry = !isDemoMode && !live.error ? live.telemetryHistory : telemetryHistory;

  // Live timer ticker to increment waiting times on waiting tokens
  useEffect(() => {
    const timer = setInterval(() => {
      setTokens((prev) =>
        prev.map((t) => {
          if (t.status === "WAITING" || t.status === "CALLED" || t.status === "GRACE_QUEUE") {
            const createdMs = new Date(t.createdAt).getTime();
            const waitingSec = Math.max(0, Math.floor((Date.now() - createdMs) / 1000));
            return { ...t, waitingSeconds: waitingSec };
          }
          if (t.status === "IN_SERVICE" && t.serviceStartedAt) {
            const startMs = new Date(t.serviceStartedAt).getTime();
            const serviceSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
            return { ...t, serviceSeconds: serviceSec };
          }
          return t;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live operational metrics
  const metrics = useMemo(() => {
    const tokens = effectiveTokens;
    const counters = effectiveCounters;
    const waitingTokens = tokens.filter(
      (t) => t.status === "WAITING" || t.status === "CALLED" || t.status === "GRACE_QUEUE"
    );
    const completedTokens = tokens.filter((t) => t.status === "COMPLETED");
    const missedTokens = tokens.filter(
      (t) => t.status === "MISSED" || t.status === "GRACE_QUEUE"
    );

    const totalCalled = tokens.filter(
      (t) => t.status === "IN_SERVICE" || t.status === "COMPLETED" || t.status === "MISSED" || t.status === "GRACE_QUEUE"
    ).length;

    const allWaits = [...completedTokens, ...waitingTokens].map(
      (t) => t.waitingSeconds || 0
    );
    const avgWait =
      allWaits.length > 0
        ? Math.round(allWaits.reduce((a, b) => a + b, 0) / allWaits.length)
        : 540;

    const missedRate =
      totalCalled > 0 ? (missedTokens.length / totalCalled) * 100 : 4.2;

    const compliantCount = completedTokens.filter(
      (t) => (t.waitingSeconds || 0) <= 900
    ).length;
    const slaPercent =
      completedTokens.length > 0
        ? Math.round((compliantCount / completedTokens.length) * 100)
        : 88;

    return {
      activeQueuesCount: counters.filter((c) => c.status === "ACTIVE").length,
      totalWaiting: waitingTokens.length,
      avgWaitSeconds: avgWait,
      servedTodayCount: completedTokens.length + (isDemoMode ? 140 : 0), // Demo-only base offset for a realistic-looking day total
      missedRatePercent: Number(missedRate.toFixed(1)),
      slaCompliancePercent: slaPercent,
      graceQueueCount: tokens.filter((t) => t.status === "GRACE_QUEUE").length,
    };
  }, [effectiveTokens, effectiveCounters, isDemoMode]);

  const addEvent = useCallback((event: Omit<OperationalEvent, "id" | "workspaceId" | "isDemo">) => {
    const newEvent: OperationalEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      workspaceId: INITIAL_WORKSPACE.id,
      isDemo: isDemoMode,
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
  }, [isDemoMode]);

  // Generate new token
  const generateToken = useCallback((categoryId: string): Token => {
    const category = categories.find((c) => c.id === categoryId) || categories[0];
    const prefix = category.prefix;
    const count = tokens.filter((t) => t.serviceCategoryId === categoryId).length + 29;
    const tokenCode = `${prefix}-${count.toString().padStart(3, "0")}`;

    const newToken: Token = {
      id: `tok-${Date.now()}`,
      workspaceId: INITIAL_WORKSPACE.id,
      serviceCategoryId: categoryId,
      counterId: null,
      tokenCode,
      status: "WAITING",
      priority: "NORMAL",
      createdAt: new Date().toISOString(),
      waitingSeconds: 0,
      isDemo: true,
    };

    setTokens((prev) => [...prev, newToken]);

    // Update queue length in counters
    setCounters((prev) =>
      prev.map((c) =>
        c.serviceCategoryId === categoryId
          ? { ...c, queueLength: c.queueLength + 1 }
          : c
      )
    );

    addEvent({
      counterId: null,
      deviceId: null,
      tokenId: newToken.id,
      eventType: "TOKEN_CREATED",
      eventTimestamp: new Date().toISOString(),
      source: "HARDWARE_SIMULATOR",
      severity: "info",
      title: `Token ${tokenCode} Issued`,
      description: `Kiosk printed ${tokenCode} for ${category.name}. Waiting queue updated.`,
      metadata: { tokenCode, category: category.name },
    });

    return newToken;
  }, [categories, tokens, addEvent]);

  // Clearance & call readiness evaluator
  const isCounterCallBlocked = useCallback(
    (counterId: string): { blocked: boolean; reason?: string } => {
      const counter = counters.find((c) => c.id === counterId);
      if (!counter) return { blocked: true, reason: "Counter not found" };

      // 1. Counter Clearance Lock: Desk physically occupied
      const isPhysicallyOccupied =
        counter.occupancyState === "OCCUPIED" ||
        counter.currentDistanceMm < counter.distanceThresholdMm;

      if (isPhysicallyOccupied) {
        return {
          blocked: true,
          reason: `Desk Occupied — Counter must be clear (ToF > ${counter.distanceThresholdMm}mm) before calling the next token.`,
        };
      }

      // 2. Active Session Lock: Counter already has a token in CALLED or IN_SERVICE
      if (counter.currentTokenId) {
        const activeToken = tokens.find(
          (t) =>
            t.id === counter.currentTokenId &&
            (t.status === "CALLED" ||
              t.status === "IN_SERVICE" ||
              t.status === "PENDING_CLEARANCE")
        );
        if (activeToken) {
          return {
            blocked: true,
            reason: `Active session in progress (${activeToken.tokenCode} is ${activeToken.status}). Complete or release active session first.`,
          };
        }
      }

      return { blocked: false };
    },
    [counters, tokens]
  );

  // Call Next Token on a counter (Hardened)
  const callNextToken = useCallback(
    (counterId: string): { success: boolean; reason?: string } => {
      const counter = counters.find((c) => c.id === counterId);
      if (!counter) return { success: false, reason: "Counter not found" };

      // Guard 1: Physical Clearance Lock
      const isPhysicallyOccupied =
        counter.occupancyState === "OCCUPIED" ||
        counter.currentDistanceMm < counter.distanceThresholdMm;

      if (isPhysicallyOccupied) {
        addEvent({
          counterId,
          deviceId: counter.deviceId,
          tokenId: counter.currentTokenId || null,
          eventType: "OPERATOR_OVERRIDE",
          eventTimestamp: new Date().toISOString(),
          source: "ESP32_EDGE",
          severity: "warning",
          title: `Call Blocked: Desk ${counter.code} Occupied`,
          description: `Desk is physically occupied (ToF ${counter.currentDistanceMm}mm < ${counter.distanceThresholdMm}mm). Customer departure required before next call.`,
          metadata: {
            reason: "DESK_OCCUPIED",
            currentDistanceMm: counter.currentDistanceMm,
            distanceThresholdMm: counter.distanceThresholdMm,
            fullExitThresholdMm: counter.fullExitThresholdMm || 1400,
          },
        });
        return {
          success: false,
          reason: `Desk Occupied — Counter must be clear (ToF > ${counter.distanceThresholdMm}mm) before calling the next token.`,
        };
      }

      // Guard 2: Duplicate Call Prevention
      if (counter.currentTokenId) {
        const activeToken = tokens.find(
          (t) =>
            t.id === counter.currentTokenId &&
            (t.status === "CALLED" ||
              t.status === "IN_SERVICE" ||
              t.status === "PENDING_CLEARANCE")
        );

        if (activeToken) {
          addEvent({
            counterId,
            deviceId: counter.deviceId,
            tokenId: activeToken.id,
            eventType: "OPERATOR_OVERRIDE",
            eventTimestamp: new Date().toISOString(),
            source: "ESP32_EDGE",
            severity: "warning",
            title: `Duplicate Call Rejected on ${counter.code}`,
            description: `Counter ${counter.code} already has active token ${activeToken.tokenCode} in state ${activeToken.status}. Complete or release active session first.`,
            metadata: {
              reason: "ACTIVE_SESSION_EXISTS",
              activeTokenCode: activeToken.tokenCode,
              activeStatus: activeToken.status,
            },
          });
          return {
            success: false,
            reason: `Active session in progress (${activeToken.tokenCode} is ${activeToken.status}).`,
          };
        }
      }

      // Guard 3: Find next eligible token (Grace queue first, then FIFO waiting)
      const eligibleToken =
        tokens.find(
          (t) =>
            t.serviceCategoryId === counter.serviceCategoryId &&
            t.status === "GRACE_QUEUE"
        ) ||
        tokens.find(
          (t) =>
            t.serviceCategoryId === counter.serviceCategoryId &&
            t.status === "WAITING"
        );

      if (!eligibleToken) {
        addEvent({
          counterId,
          deviceId: counter.deviceId,
          tokenId: null,
          eventType: "TOKEN_CALLED",
          eventTimestamp: new Date().toISOString(),
          source: "ESP32_EDGE",
          severity: "warning",
          title: `No Waiting Tokens for ${counter.code}`,
          description: `Queue is currently empty for category. Counter remains clear.`,
        });
        return {
          success: false,
          reason: "No waiting tokens available in queue.",
        };
      }

      // Transition token to CALLED
      setTokens((prev) =>
        prev.map((t) =>
          t.id === eligibleToken.id
            ? {
                ...t,
                status: "CALLED",
                counterId,
                calledAt: new Date().toISOString(),
              }
            : t
        )
      );

      // Link counter to called token
      setCounters((prev) =>
        prev.map((c) =>
          c.id === counterId
            ? {
                ...c,
                currentTokenId: eligibleToken.id,
                queueLength: Math.max(0, c.queueLength - 1),
                lastEventTime: new Date().toISOString(),
              }
            : c
        )
      );

      setSelectedTokenId(eligibleToken.id);

      addEvent({
        counterId,
        deviceId: counter.deviceId,
        tokenId: eligibleToken.id,
        eventType: "TOKEN_CALLED",
        eventTimestamp: new Date().toISOString(),
        source: "ESP32_EDGE",
        severity: "info",
        title: `Token ${eligibleToken.tokenCode} Called`,
        description: `OLED display flashed, chime triggered on ${counter.code}. 60s RFID response window active.`,
        metadata: {
          tokenCode: eligibleToken.tokenCode,
          counterCode: counter.code,
          responseWindowSec: 60,
        },
      });

      return { success: true };
    },
    [counters, tokens, addEvent]
  );

  // Trigger Service Done (Staff button pressed - Hardened)
  const triggerServiceDone = useCallback(
    (counterId: string): { success: boolean; reason?: string } => {
      const counter = counters.find((c) => c.id === counterId);
      if (!counter || !counter.currentTokenId) {
        return { success: false, reason: "Counter has no active token." };
      }

      const currentToken = tokens.find((t) => t.id === counter.currentTokenId);
      if (!currentToken || currentToken.status !== "IN_SERVICE") {
        addEvent({
          counterId,
          deviceId: counter?.deviceId || null,
          tokenId: currentToken?.id || null,
          eventType: "OPERATOR_OVERRIDE",
          eventTimestamp: new Date().toISOString(),
          source: "ESP32_EDGE",
          severity: "warning",
          title: `Service Done Rejected on ${counter?.code || counterId}`,
          description: `Cannot complete service: Token is not in IN_SERVICE status (current status: ${currentToken?.status || "None"}).`,
        });
        return {
          success: false,
          reason: `Cannot complete service: Token is ${currentToken?.status || "inactive"}.`,
        };
      }

      const nowIso = new Date().toISOString();
      const serviceSec = currentToken.serviceStartedAt
        ? Math.max(
            1,
            Math.floor(
              (Date.now() - new Date(currentToken.serviceStartedAt).getTime()) /
                1000
            )
          )
        : 360;

      // Transition token to COMPLETED
      setTokens((prev) =>
        prev.map((t) =>
          t.id === currentToken.id
            ? {
                ...t,
                status: "COMPLETED",
                serviceCompletedAt: nowIso,
                serviceSeconds: serviceSec,
              }
            : t
        )
      );

      // Check clearance
      const isClear = counter.currentDistanceMm >= counter.distanceThresholdMm;

      setCounters((prev) =>
        prev.map((c) =>
          c.id === counterId
            ? {
                ...c,
                occupancyState: isClear ? "CLEAR" : "OCCUPIED",
                currentTokenId: isClear ? null : c.currentTokenId,
                lastEventTime: nowIso,
              }
            : c
        )
      );

      addEvent({
        counterId,
        deviceId: counter.deviceId,
        tokenId: currentToken.id,
        eventType: "SERVICE_COMPLETED",
        eventTimestamp: nowIso,
        source: "ESP32_EDGE",
        severity: "success",
        title: `Service Complete: ${currentToken.tokenCode}`,
        description: `Staff pressed physical Service Done. Duration ${Math.floor(
          serviceSec / 60
        )}m ${serviceSec % 60}s. ${
          isClear ? "Desk is clear." : "Awaiting ToF student clearance."
        }`,
        metadata: {
          tokenCode: currentToken.tokenCode,
          serviceSeconds: serviceSec,
          staff: counter.staffName,
          isClear,
        },
      });

      return { success: true };
    },
    [counters, tokens, addEvent]
  );

  // Trigger Clearance (VL53L0X ToF sensor reading - Hardened)
  const triggerClearance = useCallback(
    (counterId: string, distanceMm: number) => {
      const counter = counters.find((c) => c.id === counterId);
      if (!counter) return;

      const isClear = distanceMm >= counter.distanceThresholdMm;
      const isFullExit = distanceMm >= (counter.fullExitThresholdMm || 1400);
      const newState: OccupancyState = isClear ? "CLEAR" : "OCCUPIED";
      const nowIso = new Date().toISOString();

      setCounters((prev) =>
        prev.map((c) => {
          if (c.id !== counterId) return c;

          // Only unassign currentTokenId if the token is already COMPLETED or MISSED
          let nextTokenId = c.currentTokenId;
          if (isClear && c.currentTokenId) {
            const assignedToken = tokens.find((t) => t.id === c.currentTokenId);
            if (
              assignedToken &&
              (assignedToken.status === "COMPLETED" ||
                assignedToken.status === "MISSED" ||
                assignedToken.status === "CANCELLED")
            ) {
              nextTokenId = null;
            }
          }

          return {
            ...c,
            currentDistanceMm: distanceMm,
            occupancyState: newState,
            currentTokenId: nextTokenId,
            lastEventTime: nowIso,
          };
        })
      );

      // Telemetry log
      const newTelem: CounterTelemetry = {
        id: `tel-${Date.now()}`,
        deviceId: counter.deviceId,
        counterId,
        distanceMm,
        occupancyState: newState,
        queueLength: counter.queueLength,
        currentTokenId: counter.currentTokenId,
        rssi: -52,
        recordedAt: nowIso,
        isDemo: true,
      };
      setTelemetryHistory((prev) => [newTelem, ...prev.slice(0, 50)]);

      addEvent({
        counterId,
        deviceId: counter.deviceId,
        tokenId: counter.currentTokenId,
        eventType: isClear ? "COUNTER_CLEARED" : "COUNTER_OCCUPIED",
        eventTimestamp: nowIso,
        source: "ESP32_EDGE",
        severity: isClear ? "success" : "info",
        title: isClear
          ? `Counter ${counter.code} Clear`
          : `Presence at ${counter.code}`,
        description: `VL53L0X ToF sensor measured ${distanceMm}mm (operational clear: ${
          counter.distanceThresholdMm
        }mm, full exit: ${counter.fullExitThresholdMm || 1400}mm). State: ${newState}.`,
        metadata: {
          distanceMm,
          distanceThresholdMm: counter.distanceThresholdMm,
          fullExitThresholdMm: counter.fullExitThresholdMm || 1400,
          isFullExit,
          state: newState,
        },
      });
    },
    [counters, tokens, addEvent]
  );

  // Trigger RFID Card Tap (Hardened)
  const triggerRfidTap = useCallback(
    (
      counterId: string,
      customUid?: string,
      match: boolean = true
    ): { success: boolean; reason?: string } => {
      const counter = counters.find((c) => c.id === counterId);
      if (!counter || !counter.currentTokenId) {
        return { success: false, reason: "Counter has no active token." };
      }

      const currentToken = tokens.find((t) => t.id === counter.currentTokenId);
      if (!currentToken) {
        return { success: false, reason: "Token not found." };
      }

      // Boundary check: Only CALLED tokens can be authenticated
      if (currentToken.status !== "CALLED") {
        addEvent({
          counterId,
          deviceId: counter.deviceId,
          tokenId: currentToken.id,
          eventType: "RFID_REJECTED",
          eventTimestamp: new Date().toISOString(),
          source: "ESP32_EDGE",
          severity: "warning",
          title: `RFID Ignored: Session Not in CALLED State`,
          description: `RFID scan rejected. Token ${currentToken.tokenCode} is currently in ${currentToken.status} state.`,
          metadata: {
            status: currentToken.status,
            tokenCode: currentToken.tokenCode,
          },
        });
        return {
          success: false,
          reason: `Token is already in ${currentToken.status} state.`,
        };
      }

      const uid =
        customUid ||
        `E4-${Math.floor(Math.random() * 89 + 10)}-${Math.floor(
          Math.random() * 89 + 10
        )}-8F`;
      const nowIso = new Date().toISOString();

      if (match) {
        setTokens((prev) =>
          prev.map((t) =>
            t.id === currentToken.id
              ? {
                  ...t,
                  status: "IN_SERVICE",
                  serviceStartedAt: nowIso,
                  rfidVerified: true,
                  rfidSessionUid: uid,
                }
              : t
          )
        );

        setCounters((prev) =>
          prev.map((c) =>
            c.id === counterId
              ? {
                  ...c,
                  occupancyState: "OCCUPIED",
                  currentDistanceMm: 420,
                  lastEventTime: nowIso,
                }
              : c
          )
        );

        addEvent({
          counterId,
          deviceId: counter.deviceId,
          tokenId: currentToken.id,
          eventType: "RFID_VERIFIED",
          eventTimestamp: nowIso,
          source: "ESP32_EDGE",
          severity: "success",
          title: `RFID Verified: ${currentToken.tokenCode}`,
          description: `Student smartcard UID ${uid} matched session. Service commenced on ${counter.code}.`,
          metadata: {
            uid,
            tokenCode: currentToken.tokenCode,
            counter: counter.code,
          },
        });

        return { success: true };
      } else {
        // RFID Mismatch: Token remains CALLED, countdown window remains active, audit trail logged
        addEvent({
          counterId,
          deviceId: counter.deviceId,
          tokenId: currentToken.id,
          eventType: "RFID_REJECTED",
          eventTimestamp: nowIso,
          source: "ESP32_EDGE",
          severity: "warning",
          title: `RFID Mismatch on ${counter.code}: Access Denied`,
          description: `Tapped card UID ${uid} does not match called token ${currentToken.tokenCode}. Session remains in CALLED window.`,
          metadata: {
            tappedUid: uid,
            tokenCode: currentToken.tokenCode,
            counterCode: counter.code,
            reason: "UID_MISMATCH",
          },
        });

        return {
          success: false,
          reason: "RFID smartcard UID mismatch. Token remains in CALLED state.",
        };
      }
    },
    [counters, tokens, addEvent]
  );

  // Trigger Missed Token / Move to Grace Queue (Hardened)
  const triggerMissedToken = useCallback(
    (counterId: string): { success: boolean; reason?: string } => {
      const counter = counters.find((c) => c.id === counterId);
      if (!counter || !counter.currentTokenId) {
        return { success: false, reason: "Counter has no active token." };
      }

      const currentToken = tokens.find((t) => t.id === counter.currentTokenId);
      if (!currentToken || currentToken.status !== "CALLED") {
        return {
          success: false,
          reason: "Only CALLED tokens can be shifted to Grace Queue upon timeout.",
        };
      }

      const nowIso = new Date().toISOString();

      setTokens((prev) =>
        prev.map((t) =>
          t.id === currentToken.id
            ? {
                ...t,
                status: "GRACE_QUEUE",
                priority: "GRACE",
                missedAt: nowIso,
                movedToGraceAt: nowIso,
                counterId: null,
              }
            : t
        )
      );

      setCounters((prev) =>
        prev.map((c) =>
          c.id === counterId
            ? {
                ...c,
                currentTokenId: null,
                lastEventTime: nowIso,
              }
            : c
        )
      );

      addEvent({
        counterId,
        deviceId: counter.deviceId,
        tokenId: currentToken.id,
        eventType: "TOKEN_MOVED_TO_GRACE",
        eventTimestamp: nowIso,
        source: "ESP32_EDGE",
        severity: "warning",
        title: `${currentToken.tokenCode} -> Grace Queue`,
        description: `Student did not respond within 60s window. Token preserved in Grace buffer with priority recall.`,
        metadata: { tokenCode: currentToken.tokenCode, counter: counter.code },
      });

      return { success: true };
    },
    [counters, tokens, addEvent]
  );

  const moveTokenToGrace = useCallback((tokenId: string) => {
    const nowIso = new Date().toISOString();
    setTokens((prev) =>
      prev.map((t) =>
        t.id === tokenId
          ? {
              ...t,
              status: "GRACE_QUEUE",
              priority: "GRACE",
              missedAt: nowIso,
              movedToGraceAt: nowIso,
            }
          : t
      )
    );
  }, []);

  // Toggle Device Online / Offline (for scenario 3)
  const toggleDeviceOnline = useCallback((deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === deviceId) {
          const nextOnline = !d.online;
          addEvent({
            deviceId,
            counterId: d.counterId,
            tokenId: null,
            eventType: nextOnline ? "DEVICE_CONNECTED" : "DEVICE_DISCONNECTED",
            eventTimestamp: new Date().toISOString(),
            source: nextOnline ? "CLOUD_SYNC" : "ESP32_EDGE",
            severity: nextOnline ? "success" : "critical",
            title: `${d.deviceCode} ${nextOnline ? "Connected" : "Offline"}`,
            description: nextOnline
              ? "Wi-Fi link restored. Flushing queued SPIFFS event buffer to cloud."
              : "Wi-Fi link interrupted. ESP32 switching to autonomous local flash buffer.",
          });
          return {
            ...d,
            online: nextOnline,
            lastSeenAt: new Date().toISOString(),
          };
        }
        return d;
      })
    );
  }, [addEvent]);

  // Demo Scenarios Controller
  const startScenario = useCallback((scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    setActiveScenarioStep(1);
  }, []);

  const nextScenarioStep = useCallback(() => {
    if (!activeScenarioId) return;
    const scenario = DEMO_SCENARIOS.find((s) => s.id === activeScenarioId);
    if (!scenario) return;

    if (activeScenarioId === "sc-standard-cycle") {
      if (activeScenarioStep === 1) {
        // Step 1: Staff presses Service Done on Counter 1
        triggerServiceDone("cnt-doc-01");
        setActiveScenarioStep(2);
      } else if (activeScenarioStep === 2) {
        // Step 2: Student departs -> ToF clear (1450mm)
        triggerClearance("cnt-doc-01", 1450);
        setActiveScenarioStep(3);
      } else if (activeScenarioStep === 3) {
        // Step 3: Call next token (DOC-026)
        callNextToken("cnt-doc-01");
        setActiveScenarioStep(4);
      } else if (activeScenarioStep === 4) {
        // Step 4: Tap RFID card
        triggerRfidTap("cnt-doc-01", "8E-92-3B-11", true);
        setActiveScenarioStep(5);
      } else {
        // Reset
        resetToInitialState();
        setActiveScenarioStep(1);
      }
    } else if (activeScenarioId === "sc-missed-grace") {
      if (activeScenarioStep === 1) {
        triggerMissedToken("cnt-doc-02");
        setActiveScenarioStep(2);
      } else if (activeScenarioStep === 2) {
        callNextToken("cnt-doc-02");
        setActiveScenarioStep(3);
      } else {
        resetToInitialState();
        setActiveScenarioStep(1);
      }
    } else if (activeScenarioId === "sc-offline-resilience") {
      if (activeScenarioStep === 1) {
        toggleDeviceOnline("dev-esp-01");
        setActiveScenarioStep(2);
      } else if (activeScenarioStep === 2) {
        toggleDeviceOnline("dev-esp-01");
        setActiveScenarioStep(3);
      } else {
        resetToInitialState();
        setActiveScenarioStep(1);
      }
    }
  }, [
    activeScenarioId,
    activeScenarioStep,
    triggerServiceDone,
    triggerClearance,
    callNextToken,
    triggerRfidTap,
    triggerMissedToken,
    toggleDeviceOnline,
  ]);

  const resetScenario = useCallback(() => {
    setActiveScenarioId(null);
    setActiveScenarioStep(1);
  }, []);

  const resetToInitialState = useCallback(() => {
    setCounters(INITIAL_COUNTERS);
    setDevices(INITIAL_DEVICES);
    setTokens(INITIAL_TOKENS);
    setEvents(INITIAL_EVENTS);
    setTelemetryHistory(INITIAL_TELEMETRY_LOGS);
    setSelectedCounterId("cnt-doc-01");
    setSelectedTokenId(null);
    setActiveScenarioId(null);
    setActiveScenarioStep(1);
  }, []);

  const activeCounter = useMemo(
    () => effectiveCounters.find((c) => c.id === selectedCounterId) || effectiveCounters[0],
    [effectiveCounters, selectedCounterId]
  );

  const activeToken = useMemo(
    () => (selectedTokenId ? effectiveTokens.find((t) => t.id === selectedTokenId) : undefined),
    [effectiveTokens, selectedTokenId]
  );

  return (
    <QueuePulseContext.Provider
      value={{
        workspace: !isDemoMode && live.workspace && !live.error ? live.workspace : workspace,
        categories: effectiveCategories,
        counters: effectiveCounters,
        devices: effectiveDevices,
        tokens: effectiveTokens,
        events: effectiveEvents,
        telemetryHistory: effectiveTelemetry,
        selectedCounterId,
        selectedTokenId,
        setSelectedCounterId,
        setSelectedTokenId,
        isDemoMode,
        setIsDemoMode,
        activeScenarioId,
        activeScenarioStep,
        startScenario,
        nextScenarioStep,
        resetScenario,
        generateToken,
        callNextToken,
        triggerServiceDone,
        triggerClearance,
        triggerRfidTap,
        triggerMissedToken,
        moveTokenToGrace,
        toggleDeviceOnline,
        resetToInitialState,
        isCounterCallBlocked,
        activeCounter,
        activeToken,
        metrics,
      }}
    >
      {children}
    </QueuePulseContext.Provider>
  );
};

export const useQueuePulse = () => {
  const context = useContext(QueuePulseContext);
  if (!context) {
    throw new Error("useQueuePulse must be used within a QueuePulseProvider");
  }
  return context;
};

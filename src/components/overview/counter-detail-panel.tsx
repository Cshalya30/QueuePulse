"use client";

import React, { useState } from "react";
import { useQueuePulse } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TofGauge } from "@/components/ui/tof-gauge";
import { RfidIndicator } from "@/components/ui/rfid-indicator";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import {
  Cpu,
  Radio,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  AlertCircle,
  Clock,
  Layers,
  Sliders,
  Play,
  RotateCcw,
} from "lucide-react";

export const CounterDetailPanel: React.FC = () => {
  const {
    activeCounter,
    categories,
    devices,
    tokens,
    callNextToken,
    triggerServiceDone,
    triggerClearance,
    triggerRfidTap,
    triggerMissedToken,
    setSelectedTokenId,
    isCounterCallBlocked,
  } = useQueuePulse();

  const [simDistance, setSimDistance] = useState<number>(
    activeCounter?.currentDistanceMm || 440
  );

  if (!activeCounter) {
    return (
      <Card className="h-full flex items-center justify-center p-8 text-center text-text-tertiary">
        Select a counter to view hardware details and actions.
      </Card>
    );
  }

  const category = categories.find((c) => c.id === activeCounter.serviceCategoryId);
  const device = devices.find((d) => d.id === activeCounter.deviceId);
  const currentToken = tokens.find((t) => t.id === activeCounter.currentTokenId);
  const callStatus = isCounterCallBlocked(activeCounter.id);

  // Filter waiting tokens for this counter category
  const waitingTokens = tokens.filter(
    (t) =>
      t.serviceCategoryId === activeCounter.serviceCategoryId &&
      (t.status === "WAITING" || t.status === "GRACE_QUEUE")
  );

  return (
    <Card className="border-border-subtle bg-surface-1 shadow-md">
      <CardHeader className="pb-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-text-primary px-2 py-0.5 bg-surface-3 rounded border border-border-strong">
                {activeCounter.code}
              </span>
              <span className="text-xs font-semibold text-text-primary">
                {activeCounter.name}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              Staff Operator:{" "}
              <strong className="text-text-secondary">{activeCounter.staffName}</strong> ·{" "}
              {category?.name}
            </p>
          </div>

          <Badge variant={device?.online ? "live" : "critical"} dot>
            {device?.online ? "Node Online" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-3.5">
        {/* Active Token Hero Box */}
        <div className="bg-surface-2 border border-border-subtle rounded-md p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="uppercase font-semibold tracking-wider text-text-tertiary">
              Active Desk Session
            </span>
            {currentToken ? (
              <Badge
                variant={currentToken.status === "IN_SERVICE" ? "live" : "info"}
                dot
              >
                {currentToken.status === "IN_SERVICE" ? "In Service" : "Awaiting Card"}
              </Badge>
            ) : (
              <Badge variant="neutral">Idle / Clear</Badge>
            )}
          </div>

          {currentToken ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold font-mono text-text-primary tabular-nums">
                    {currentToken.tokenCode}
                  </span>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {category?.name || "Service Session"}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[10px] uppercase text-text-tertiary">
                    {currentToken.status === "IN_SERVICE" ? "Service Time" : "Waiting Time"}
                  </div>
                  <div className="text-base font-bold text-text-primary tabular-nums">
                    {currentToken.status === "IN_SERVICE"
                      ? formatDuration(currentToken.serviceSeconds || 120)
                      : formatDuration(currentToken.waitingSeconds || 420)}
                  </div>
                </div>
              </div>

              {/* Consolidated Telemetry Status */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle font-mono text-xs">
                <div className="p-2 bg-surface-3/50 rounded border border-border-subtle flex items-center justify-between">
                  <span className="text-text-tertiary text-[10px] uppercase font-sans">RFID</span>
                  {currentToken.rfidVerified ? (
                    <span className="text-accent-live text-[11px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-accent-info text-[11px] flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse" />
                      Awaiting Tap
                    </span>
                  )}
                </div>

                <div className="p-2 bg-surface-3/50 rounded border border-border-subtle flex items-center justify-between">
                  <span className="text-text-tertiary text-[10px] uppercase font-sans">Presence</span>
                  {activeCounter.occupancyState === "OCCUPIED" ||
                  activeCounter.currentDistanceMm < activeCounter.distanceThresholdMm ? (
                    <span className="text-accent-live text-[11px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-live" />
                      {activeCounter.currentDistanceMm}mm
                    </span>
                  ) : (
                    <span className="text-text-tertiary text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
                      Clear ({activeCounter.currentDistanceMm}mm)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-text-tertiary font-mono">
              Desk is clear and ready for the next customer.
            </div>
          )}
        </div>

        {/* Compact ToF Distance Adjuster (Simulation / Bench testing) */}
        <div className="bg-surface-2/40 border border-border-subtle rounded-md px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-text-secondary flex items-center gap-1.5 text-[11px]">
              <Sliders className="w-3 h-3 text-accent-info" />
              ToF Presence Simulation
            </span>
            <span className="text-[11px] font-mono text-text-primary">
              {activeCounter.currentDistanceMm} mm
            </span>
          </div>

          <input
            type="range"
            min="100"
            max="1800"
            step="20"
            value={activeCounter.currentDistanceMm}
            onChange={(e) => {
              const val = Number(e.target.value);
              triggerClearance(activeCounter.id, val);
            }}
            className="w-full accent-accent-live h-1 bg-surface-3 rounded cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] text-text-tertiary font-mono">
            <span>&lt; {activeCounter.distanceThresholdMm}mm: Occupied</span>
            <span>&ge; {activeCounter.distanceThresholdMm}mm: Clear</span>
          </div>
        </div>

        {/* Hardware Action Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="live"
              onClick={() => callNextToken(activeCounter.id)}
              disabled={callStatus.blocked}
              className="text-xs gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Call Next
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={() => triggerServiceDone(activeCounter.id)}
              disabled={!currentToken || currentToken.status !== "IN_SERVICE"}
              className="text-xs gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-live" />
              Service Done
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => triggerRfidTap(activeCounter.id, undefined, true)}
              disabled={!currentToken || currentToken.status !== "CALLED"}
              className="text-xs gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-accent-info" />
              Tap RFID
            </Button>

            <Button
              size="sm"
              variant="warning"
              onClick={() => triggerMissedToken(activeCounter.id)}
              disabled={!currentToken || currentToken.status !== "CALLED"}
              className="text-xs gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 text-accent-warning" />
              Send to Grace
            </Button>
          </div>

          {/* Clearance Lockout or Duplicate Session Notice */}
          {callStatus.blocked && (
            <div className="p-2 rounded bg-surface-2 border border-accent-warning/30 text-[11px] text-accent-warning font-mono flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent-warning" />
              <span>{callStatus.reason}</span>
            </div>
          )}
        </div>

        {/* Upcoming Queue Preview */}
        <div className="pt-2 border-t border-border-subtle space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-secondary flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-text-tertiary" />
              Next in Line for {category?.code}
            </span>
            <span className="text-[11px] font-mono text-text-tertiary">
              {waitingTokens.length} waiting
            </span>
          </div>

          {waitingTokens.length > 0 ? (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {waitingTokens.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTokenId(t.id)}
                  className="p-2 rounded bg-surface-2/60 border border-border-subtle flex items-center justify-between text-xs hover:border-border-strong cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-text-primary">
                      {t.tokenCode}
                    </span>
                    {t.priority === "GRACE" && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-accent-warning/15 text-accent-warning font-mono">
                        GRACE
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-text-tertiary text-[11px]">
                    wait: {formatDuration(t.waitingSeconds)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-text-tertiary py-2 text-center">
              No waiting tokens in this queue.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

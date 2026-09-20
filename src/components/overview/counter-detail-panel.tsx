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
                    {currentToken.notes || "Standard Student Service Request"}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs text-text-tertiary">
                    {currentToken.status === "IN_SERVICE" ? "Service Clock" : "Waiting Time"}
                  </div>
                  <div className="text-sm font-bold text-text-primary tabular-nums">
                    {currentToken.status === "IN_SERVICE"
                      ? formatDuration(currentToken.serviceSeconds || 120)
                      : formatDuration(currentToken.waitingSeconds || 420)}
                  </div>
                </div>
              </div>

              {/* Hardware Sensors Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border-subtle">
                <RfidIndicator
                  verified={Boolean(currentToken.rfidVerified)}
                  uid={currentToken.rfidSessionUid}
                  timeRemainingSec={currentToken.status === "CALLED" ? 38 : undefined}
                />
                <TofGauge
                  distanceMm={activeCounter.currentDistanceMm}
                  thresholdMm={activeCounter.distanceThresholdMm}
                  state={activeCounter.occupancyState}
                />
              </div>
            </div>
          ) : (
            <div className="py-5 text-center text-xs text-text-tertiary">
              No customer currently assigned to this desk. Counter is ready for next call.
            </div>
          )}
        </div>

        {/* Live ToF Sensor Slider Test */}
        <div className="bg-surface-2/40 border border-border-subtle rounded-md p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-secondary flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-accent-info" />
              Interactive VL53L0X ToF Distance Adjuster
            </span>
            <span className="text-[11px] font-mono text-text-primary">
              {activeCounter.currentDistanceMm}mm
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
            className="w-full accent-accent-live h-1.5 bg-surface-3 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] text-text-tertiary">
            <span>&lt; 800mm: Student Present</span>
            <span>&gt; 800mm: Counter Clear</span>
          </div>
        </div>

        {/* Hardware Action Buttons */}
        <div className="pt-2 space-y-2">
          <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider flex items-center justify-between">
            <span>ESP32 Hardware Controls</span>
            <span className="text-[9px] text-accent-live font-mono">
              Authoritative Edge Logic
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="live"
              onClick={() => callNextToken(activeCounter.id)}
              className="text-xs gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Call Next Token
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
              Tap RFID Smartcard
            </Button>

            <Button
              size="sm"
              variant="warning"
              onClick={() => triggerMissedToken(activeCounter.id)}
              disabled={!currentToken || currentToken.status !== "CALLED"}
              className="text-xs gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 text-accent-warning" />
              Move to Grace Queue
            </Button>
          </div>
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

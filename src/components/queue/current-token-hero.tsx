"use client";

import React, { useState, useEffect } from "react";
import { useQueuePulse } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TofGauge } from "@/components/ui/tof-gauge";
import { RfidIndicator } from "@/components/ui/rfid-indicator";
import { formatDuration, formatTime } from "@/lib/utils";
import {
  Radio,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  PhoneCall,
} from "lucide-react";

export const CurrentTokenHero: React.FC = () => {
  const {
    activeCounter,
    tokens,
    categories,
    callNextToken,
    triggerServiceDone,
    triggerRfidTap,
    triggerMissedToken,
    setSelectedTokenId,
    isCounterCallBlocked,
  } = useQueuePulse();

  const [responseCountdown, setResponseCountdown] = useState<number>(38);

  const currentToken = tokens.find((t) => t.id === activeCounter?.currentTokenId);
  const category = categories.find((c) => c.id === activeCounter?.serviceCategoryId);
  const callStatus = activeCounter ? isCounterCallBlocked(activeCounter.id) : { blocked: true };

  // Countdown timer for called state
  useEffect(() => {
    if (currentToken?.status === "CALLED") {
      const interval = setInterval(() => {
        setResponseCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setResponseCountdown(60);
    }
  }, [currentToken?.status, currentToken?.id]);

  if (!activeCounter) return null;

  return (
    <Card className="bg-surface-1 border-border-strong relative overflow-hidden shadow-lg">
      {/* Top Ambient Glow */}
      {currentToken?.status === "IN_SERVICE" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent-live" />
      )}
      {currentToken?.status === "CALLED" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent-info animate-pulse" />
      )}

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-surface-3 text-text-primary rounded border border-border-strong">
              {activeCounter.code}
            </span>
            <span className="text-sm font-semibold text-text-primary">
              {activeCounter.name}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{
                color: category?.color || "#b8ef79",
                borderColor: `${category?.color || "#b8ef79"}33`,
                backgroundColor: `${category?.color || "#b8ef79"}12`,
              }}
            >
              {category?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentToken ? (
              <Badge
                variant={currentToken.status === "IN_SERVICE" ? "live" : "info"}
                dot
              >
                {currentToken.status === "IN_SERVICE"
                  ? "In Service"
                  : `Called · ${responseCountdown}s Window`}
              </Badge>
            ) : (
              <Badge variant="neutral">Ready for Next Customer</Badge>
            )}
          </div>
        </div>

        {/* Hero Token Visual */}
        {currentToken ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Left: Token Identifier & Duration */}
            <div
              className="lg:col-span-5 cursor-pointer group"
              onClick={() => setSelectedTokenId(currentToken.id)}
            >
              <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">
                Serving Customer Token
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-extrabold font-mono text-text-primary tracking-tight tabular-nums group-hover:text-accent-live transition-colors">
                  {currentToken.tokenCode}
                </span>
                <span className="font-mono text-xs text-text-tertiary">
                  (Category: {category?.name})
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-text-tertiary text-[10px] block uppercase">
                    {currentToken.status === "IN_SERVICE" ? "Service Time" : "Response Window"}
                  </span>
                  <span className="text-text-primary font-bold text-sm">
                    {currentToken.status === "IN_SERVICE"
                      ? formatDuration(currentToken.serviceSeconds || 120)
                      : `${responseCountdown}s remaining`}
                  </span>
                </div>
                <div>
                  <span className="text-text-tertiary text-[10px] block uppercase">
                    Queue Wait Time
                  </span>
                  <span className="text-text-secondary font-semibold text-sm">
                    {formatDuration(currentToken.waitingSeconds || 420)}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Crisp Telemetry Status */}
            <div className="lg:col-span-4 p-3 bg-surface-2 rounded-md border border-border-subtle space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-text-tertiary uppercase text-[10px] font-sans">RFID Auth</span>
                {currentToken.rfidVerified ? (
                  <span className="text-accent-live font-semibold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified ({currentToken.rfidSessionUid || "Card Matched"})
                  </span>
                ) : (
                  <span className="text-accent-info flex items-center gap-1 text-[11px]">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    Awaiting Card ({responseCountdown}s)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-border-subtle/50">
                <span className="text-text-tertiary uppercase text-[10px] font-sans">Desk Presence</span>
                {activeCounter.occupancyState === "OCCUPIED" ||
                activeCounter.currentDistanceMm < activeCounter.distanceThresholdMm ? (
                  <span className="text-accent-live font-semibold flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-live" />
                    Occupied ({activeCounter.currentDistanceMm}mm)
                  </span>
                ) : (
                  <span className="text-text-tertiary flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
                    Clear ({activeCounter.currentDistanceMm}mm)
                  </span>
                )}
              </div>
            </div>

            {/* Right: Clerk Action Buttons */}
            <div className="lg:col-span-3 flex flex-col gap-2">
              {currentToken.status === "CALLED" && (
                <>
                  <Button
                    size="sm"
                    variant="live"
                    onClick={() => triggerRfidTap(activeCounter.id, undefined, true)}
                    className="text-xs justify-center"
                  >
                    Tap RFID (Verify)
                  </Button>
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() => triggerMissedToken(activeCounter.id)}
                    className="text-xs justify-center"
                  >
                    Send to Grace Queue
                  </Button>
                </>
              )}

              {currentToken.status === "IN_SERVICE" && (
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => triggerServiceDone(activeCounter.id)}
                  className="text-xs gap-1.5 justify-center py-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-accent-live" />
                  <span>Service Complete</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-text-secondary">
              {callStatus.blocked
                ? "Desk is physically occupied. Previous customer must vacate before calling next customer."
                : `Desk ${activeCounter.code} is clear and ready for the next customer.`}
            </p>
            <div className="flex flex-col items-center gap-2">
              <Button
                size="md"
                variant="live"
                onClick={() => callNextToken(activeCounter.id)}
                disabled={callStatus.blocked}
                className="gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                Call Next Token
              </Button>
              {callStatus.blocked && (
                <div className="text-xs text-accent-warning font-mono bg-accent-warning/10 border border-accent-warning/30 px-3 py-1.5 rounded-md flex items-center gap-1.5 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{callStatus.reason}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

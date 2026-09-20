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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Token Identifier */}
            <div
              className="md:col-span-5 cursor-pointer group"
              onClick={() => setSelectedTokenId(currentToken.id)}
            >
              <div className="text-xs uppercase font-semibold text-text-tertiary tracking-wider">
                Current Serving Token
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-extrabold font-mono text-text-primary tracking-tight tabular-nums group-hover:text-accent-live transition-colors">
                  {currentToken.tokenCode}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">
                {currentToken.notes || "Standard university administration request."}
              </p>
              <div className="mt-2 text-[11px] font-mono text-accent-info">
                Click to inspect full audit timeline →
              </div>
            </div>

            {/* Middle: Live Timers */}
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-1 gap-3 p-3 bg-surface-2 rounded-md border border-border-subtle font-mono">
              <div>
                <div className="text-[10px] uppercase text-text-tertiary">
                  {currentToken.status === "IN_SERVICE" ? "Service Duration" : "Response Time"}
                </div>
                <div className="text-lg font-bold text-text-primary tabular-nums">
                  {currentToken.status === "IN_SERVICE"
                    ? formatDuration(currentToken.serviceSeconds || 120)
                    : `${responseCountdown}s`}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase text-text-tertiary">
                  Initial Queue Wait
                </div>
                <div className="text-sm font-semibold text-text-secondary tabular-nums">
                  {formatDuration(currentToken.waitingSeconds || 420)}
                </div>
              </div>
            </div>

            {/* Right: Hardware Telemetry Sensors */}
            <div className="md:col-span-4 space-y-2.5">
              <RfidIndicator
                verified={Boolean(currentToken.rfidVerified)}
                uid={currentToken.rfidSessionUid}
                timeRemainingSec={currentToken.status === "CALLED" ? responseCountdown : undefined}
              />
              <TofGauge
                distanceMm={activeCounter.currentDistanceMm}
                thresholdMm={activeCounter.distanceThresholdMm}
                state={activeCounter.occupancyState}
              />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-text-secondary">
              {callStatus.blocked
                ? "Desk is physically occupied or session active. Clearance required before calling next customer."
                : "Counter is clear and ready. Next waiting customer can be called."}
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
                Call Next Token from Queue
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

        {/* Quick Action Trigger Strip */}
        {currentToken && (
          <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-text-tertiary font-mono">
              ESP32 Node: <strong className="text-text-secondary">ESP32-NODE-{activeCounter.code}</strong>
            </div>

            <div className="flex items-center gap-2">
              {currentToken.status === "CALLED" && (
                <>
                  <Button
                    size="sm"
                    variant="live"
                    onClick={() => triggerRfidTap(activeCounter.id, undefined, true)}
                    className="text-xs"
                  >
                    Tap Student RFID (Verify)
                  </Button>
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() => triggerMissedToken(activeCounter.id)}
                    className="text-xs"
                  >
                    Missed · Send to Grace
                  </Button>
                </>
              )}

              {currentToken.status === "IN_SERVICE" && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => triggerServiceDone(activeCounter.id)}
                  className="text-xs gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-live" />
                  Staff: Service Complete
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

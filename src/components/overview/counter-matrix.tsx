"use client";

import React from "react";
import { useQueuePulse } from "@/lib/store";
import { Counter, Token } from "@/types/queuepulse";
import { Badge } from "@/components/ui/badge";
import { TofGauge } from "@/components/ui/tof-gauge";
import {
  User,
  Radio,
  Clock,
  Activity,
  Layers,
  CheckCircle2,
  ChevronRight,
  Wifi,
} from "lucide-react";
import { cn, formatDuration, formatRelativeTime } from "@/lib/utils";

export const CounterMatrix: React.FC = () => {
  const {
    counters,
    categories,
    devices,
    tokens,
    selectedCounterId,
    setSelectedCounterId,
  } = useQueuePulse();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Counter Matrix
          </span>
          <span className="text-xs text-text-tertiary">
            ({counters.length} hardware nodes)
          </span>
        </div>
        <span className="text-[11px] text-text-tertiary font-mono">
          Select counter for live telemetry & controls
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {counters.map((counter) => {
          const isSelected = selectedCounterId === counter.id;
          const category = categories.find((c) => c.id === counter.serviceCategoryId);
          const device = devices.find((d) => d.id === counter.deviceId);
          const currentToken = tokens.find((t) => t.id === counter.currentTokenId);
          const isOccupied = counter.occupancyState === "OCCUPIED";

          return (
            <div
              key={counter.id}
              onClick={() => setSelectedCounterId(counter.id)}
              className={cn(
                "p-4 rounded-md border text-left transition-all duration-150 cursor-pointer relative overflow-hidden group",
                isSelected
                  ? "bg-surface-2 border-accent-live/50 shadow-md ring-1 ring-accent-live/30"
                  : "bg-surface-1 border-border-subtle hover:border-border-strong hover:bg-surface-2/60"
              )}
            >
              {/* Top Row: Counter code & device status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-text-primary px-2 py-0.5 bg-surface-3 rounded border border-border-subtle">
                    {counter.code}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full border text-[11px]"
                    style={{
                      color: category?.color || "#b8ef79",
                      borderColor: `${category?.color || "#b8ef79"}33`,
                      backgroundColor: `${category?.color || "#b8ef79"}12`,
                    }}
                  >
                    {category?.name || "Service"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {device?.online ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-accent-live font-mono">
                      <Wifi className="w-3 h-3" />
                      {device.wifiSignalRssi}dBm
                    </span>
                  ) : (
                    <Badge variant="critical" dot>
                      Node Offline
                    </Badge>
                  )}
                </div>
              </div>

              {/* Middle Row: Active Token & Presence */}
              <div className="mt-3.5 grid grid-cols-2 gap-3 pt-3 border-t border-border-subtle">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">
                    Current Token
                  </div>
                  {currentToken ? (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-base font-bold text-text-primary font-mono tabular-nums">
                        {currentToken.tokenCode}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.2 rounded font-mono",
                          currentToken.status === "IN_SERVICE"
                            ? "text-accent-live bg-accent-live/10 border border-accent-live/25"
                            : "text-accent-info bg-accent-info/10 border border-accent-info/25 animate-pulse"
                        )}
                      >
                        {currentToken.status === "IN_SERVICE" ? "In Service" : "Called"}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-text-tertiary font-mono">
                      — Ready for Next —
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">
                    ToF Laser Presence
                  </div>
                  <div className="mt-1">
                    <TofGauge
                      distanceMm={counter.currentDistanceMm}
                      thresholdMm={counter.distanceThresholdMm}
                      state={counter.occupancyState}
                      compact
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Staff, Queue length, and last event */}
              <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-tertiary">
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3 h-3 text-text-secondary" />
                  <span className="text-text-secondary truncate">
                    {counter.staffName || "Staff"}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-text-tertiary" />
                    <span>{counter.queueLength} waiting</span>
                  </span>
                  <span>·</span>
                  <span>{formatRelativeTime(counter.lastEventTime)}</span>
                </div>
              </div>

              {/* Active selection indicator */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent-live rounded-bl-sm" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
            ({counters.length} Desks)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {counters.map((counter) => {
          const isSelected = selectedCounterId === counter.id;
          const category = categories.find((c) => c.id === counter.serviceCategoryId);
          const device = devices.find((d) => d.id === counter.deviceId);
          const currentToken = tokens.find((t) => t.id === counter.currentTokenId);
          const isOccupied =
            counter.occupancyState === "OCCUPIED" ||
            counter.currentDistanceMm < counter.distanceThresholdMm;

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
              {/* Top Row: Counter code, category, online status */}
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

                <div>
                  {device?.online ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-accent-live font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-live" />
                      Online
                    </span>
                  ) : (
                    <Badge variant="critical" dot>
                      Offline
                    </Badge>
                  )}
                </div>
              </div>

              {/* Middle Row: Current Token & Desk Presence */}
              <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-border-subtle items-center">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">
                    Serving Token
                  </div>
                  {currentToken ? (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-text-primary font-mono tabular-nums">
                        {currentToken.tokenCode}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded font-mono",
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
                      Desk Clear · Ready
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider mb-1">
                    Desk Presence
                  </div>
                  {isOccupied ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-accent-live/10 text-accent-live border border-accent-live/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-live" />
                      Occupied ({counter.currentDistanceMm}mm)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-surface-3 text-text-tertiary border border-border-subtle">
                      Clear ({counter.currentDistanceMm}mm)
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Row: Staff & Queue length */}
              <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-tertiary">
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3 h-3 text-text-secondary" />
                  <span className="text-text-secondary truncate">
                    {counter.staffName || "Staff"}
                  </span>
                </div>

                <div className="flex items-center gap-1 font-mono text-text-secondary">
                  <Layers className="w-3 h-3 text-text-tertiary" />
                  <span>{counter.queueLength} waiting in line</span>
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

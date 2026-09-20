import * as React from "react";
import { cn } from "@/lib/utils";
import { OccupancyState } from "@/types/queuepulse";
import { Activity, ShieldCheck, UserX } from "lucide-react";

interface TofGaugeProps {
  distanceMm: number;
  thresholdMm?: number;
  state: OccupancyState;
  compact?: boolean;
}

export const TofGauge: React.FC<TofGaugeProps> = ({
  distanceMm,
  thresholdMm = 800,
  state,
  compact = false,
}) => {
  const maxDistance = 2000;
  const clampedDistance = Math.min(Math.max(distanceMm, 0), maxDistance);
  const percent = Math.round((clampedDistance / maxDistance) * 100);
  const thresholdPercent = Math.round((thresholdMm / maxDistance) * 100);
  const isOccupied = state === "OCCUPIED" || distanceMm < thresholdMm;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden relative">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isOccupied ? "bg-accent-live" : "bg-text-tertiary"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[11px] font-mono tabular-nums text-text-secondary">
          {distanceMm}mm
        </span>
      </div>
    );
  }

  return (
    <div className="bg-surface-2/60 border border-border-subtle rounded-md p-3.5 space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Activity className="w-3.5 h-3.5 text-accent-info" />
          <span className="font-medium">VL53L0X ToF Laser Presence</span>
        </div>
        <span
          className={cn(
            "text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border",
            isOccupied
              ? "text-accent-live bg-accent-live/10 border-accent-live/25"
              : "text-text-secondary bg-surface-3 border-border-subtle"
          )}
        >
          {isOccupied ? "Person Present" : "Counter Clear"}
        </span>
      </div>

      {/* Distance meter bar */}
      <div className="relative pt-1 pb-2">
        <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden relative">
          {/* Active distance fill */}
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              isOccupied ? "bg-accent-live" : "bg-text-secondary"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Threshold marker pin */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent-warning z-10 pointer-events-none"
          style={{ left: `${thresholdPercent}%` }}
          title={`Clearance Threshold: ${thresholdMm}mm`}
        >
          <div className="absolute -top-3 -translate-x-1/2 text-[9px] text-accent-warning font-mono">
            {thresholdMm}mm
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-text-tertiary font-mono pt-1">
        <span>0mm (Contact)</span>
        <span className="text-text-primary font-semibold text-xs tabular-nums">
          Current: {distanceMm} mm
        </span>
        <span>2000mm (Clear)</span>
      </div>
    </div>
  );
};

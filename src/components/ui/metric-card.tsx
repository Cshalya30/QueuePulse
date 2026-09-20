import * as React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  delta?: {
    value: string;
    trend: "up" | "down" | "neutral";
    label?: string;
  };
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sublabel,
  delta,
  icon,
  highlight = false,
}) => {
  return (
    <div
      className={cn(
        "bg-surface-1 border border-border-subtle rounded-md p-3.5 sm:p-4 flex flex-col justify-between transition-all hover:border-border-strong",
        highlight && "border-accent-live/30 bg-accent-live/[0.02]"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary font-medium tracking-wide uppercase">
          {label}
        </span>
        {icon && <span className="text-text-tertiary">{icon}</span>}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary tabular-nums">
          {value}
        </div>

        {delta && (
          <div
            className={cn(
              "text-[11px] font-medium px-1.5 py-0.5 rounded-sm tabular-nums flex items-center gap-1 border shrink-0",
              delta.trend === "up" && "text-accent-live bg-accent-live/10 border-accent-live/20",
              delta.trend === "down" && "text-accent-critical bg-accent-critical/10 border-accent-critical/20",
              delta.trend === "neutral" && "text-text-secondary bg-surface-3 border-border-subtle"
            )}
          >
            {delta.trend === "up" && "↑"}
            {delta.trend === "down" && "↓"}
            {delta.value}
          </div>
        )}
      </div>

      {(sublabel || (delta && delta.label)) && (
        <div className="mt-1 text-[11px] text-text-tertiary truncate">
          {delta?.label || sublabel}
        </div>
      )}
    </div>
  );
};

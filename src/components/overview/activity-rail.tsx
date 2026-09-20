"use client";

import React from "react";
import { useQueuePulse } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, getSeverityStyle } from "@/lib/utils";
import { ListRestart, Radio, Cpu, ShieldCheck } from "lucide-react";

export const ActivityRail: React.FC = () => {
  const { events } = useQueuePulse();

  return (
    <Card className="bg-surface-1 border-border-subtle shadow-sm flex flex-col h-full">
      <CardHeader className="pb-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ListRestart className="w-4 h-4 text-accent-live" />
            <span>Live System Events</span>
          </CardTitle>
          <span className="text-[10px] font-mono text-accent-live bg-accent-live/10 border border-accent-live/20 px-1.5 py-0.2 rounded">
            ESP32 + Cloud Stream
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-1 flex-1 overflow-y-auto max-h-[380px] space-y-2.5 pr-1">
        {events.slice(0, 10).map((evt) => {
          const style = getSeverityStyle(evt.severity);

          return (
            <div
              key={evt.id}
              className="p-2.5 rounded-sm bg-surface-2/40 border border-border-subtle text-xs hover:border-border-strong transition-colors space-y-1"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-text-primary leading-tight">
                  {evt.title}
                </span>
                <span className="text-[10px] font-mono text-text-tertiary shrink-0 tabular-nums">
                  {formatRelativeTime(evt.eventTimestamp)}
                </span>
              </div>

              <p className="text-[11px] text-text-secondary line-clamp-2">
                {evt.description}
              </p>

              <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-text-tertiary">
                <span className="px-1 py-0.2 rounded bg-surface-3 text-text-secondary border border-border-subtle">
                  {evt.source}
                </span>
                <span className={style.textColor}>{evt.severity.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

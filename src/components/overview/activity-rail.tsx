"use client";

import React from "react";
import { useQueuePulse } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, getSeverityStyle } from "@/lib/utils";
import { ListRestart, Radio, Cpu, ShieldCheck } from "lucide-react";

import Link from "next/link";

export const ActivityRail: React.FC = () => {
  const { events } = useQueuePulse();

  return (
    <Card className="bg-surface-1 border-border-subtle shadow-sm flex flex-col h-full">
      <CardHeader className="pb-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ListRestart className="w-4 h-4 text-accent-live" />
            <span>Recent System Activity</span>
          </CardTitle>
          <Link
            href="/app/events"
            className="text-[11px] font-mono text-accent-info hover:underline"
          >
            All Logs →
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-1 flex-1 space-y-2 pr-1">
        {events.slice(0, 5).map((evt) => {
          const style = getSeverityStyle(evt.severity);

          return (
            <div
              key={evt.id}
              className="p-2 rounded bg-surface-2/40 border border-border-subtle text-xs hover:border-border-strong transition-colors space-y-0.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-text-primary truncate">
                  {evt.title}
                </span>
                <span className="text-[10px] font-mono text-text-tertiary shrink-0 tabular-nums">
                  {formatRelativeTime(evt.eventTimestamp)}
                </span>
              </div>

              <p className="text-[11px] text-text-secondary truncate">
                {evt.description}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

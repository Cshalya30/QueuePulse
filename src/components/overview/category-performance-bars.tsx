"use client";

import React from "react";
import { useQueuePulse } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";
import { BarChart2, CheckCircle2, Clock } from "lucide-react";

export const CategoryPerformanceBars: React.FC = () => {
  const { categories, tokens } = useQueuePulse();

  return (
    <Card className="bg-surface-1 border-border-subtle shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-accent-info" />
            <span>Category Service Level Performance</span>
          </span>
          <span className="text-[11px] text-text-tertiary font-mono">
            SLA Threshold: &lt; 15 min
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2 space-y-3.5">
        {categories.map((cat) => {
          const catTokens = tokens.filter((t) => t.serviceCategoryId === cat.id);
          const completed = catTokens.filter((t) => t.status === "COMPLETED");
          const waiting = catTokens.filter(
            (t) => t.status === "WAITING" || t.status === "CALLED" || t.status === "GRACE_QUEUE"
          );

          // Calculate average wait
          const allWaits = catTokens.map((t) => t.waitingSeconds || 0);
          const avgWaitSec =
            allWaits.length > 0
              ? Math.round(allWaits.reduce((a, b) => a + b, 0) / allWaits.length)
              : 480;

          const isCompliant = avgWaitSec <= cat.slaTargetSeconds;
          const waitPercentOfSla = Math.min(
            100,
            Math.round((avgWaitSec / cat.slaTargetSeconds) * 100)
          );

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-text-primary">{cat.name}</span>
                  <span className="text-[10px] font-mono text-text-tertiary">
                    ({cat.prefix})
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-text-secondary">
                    {waiting.length} waiting
                  </span>
                  <span
                    className={
                      isCompliant
                        ? "text-accent-live font-semibold"
                        : "text-accent-critical font-semibold"
                    }
                  >
                    avg {formatDuration(avgWaitSec)} / {formatDuration(cat.slaTargetSeconds)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden flex">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${waitPercentOfSla}%`,
                    backgroundColor: isCompliant ? cat.color : "#ef7777",
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

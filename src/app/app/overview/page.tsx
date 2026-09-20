"use client";

import React from "react";
import { MetricStrip } from "@/components/overview/metric-strip";
import { CounterMatrix } from "@/components/overview/counter-matrix";
import { CounterDetailPanel } from "@/components/overview/counter-detail-panel";
import { QueuePressureChart } from "@/components/overview/queue-pressure-chart";
import { CategoryPerformanceBars } from "@/components/overview/category-performance-bars";
import { ActivityRail } from "@/components/overview/activity-rail";
import { useQueuePulse } from "@/lib/store";
import { Radio, Layers, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OperationsOverviewPage() {
  const { workspace, isDemoMode, generateToken, categories } = useQueuePulse();

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Operations Overview
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-accent-live/15 text-accent-live font-mono font-semibold border border-accent-live/30">
              LIVE
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {workspace.name} · Real-time physical counter telemetry & queue state machine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateToken(categories[0].id)}
            className="text-xs gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-accent-live" />
            Issue Test Token (+DOC)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => generateToken(categories[1].id)}
            className="text-xs gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-accent-info" />
            +ACC Token
          </Button>
        </div>
      </div>

      {/* Top Metric Strip */}
      <MetricStrip />

      {/* Main Operational Split-Pane Workspace (Haulix Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Counter Matrix (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <CounterMatrix />
          <QueuePressureChart />
        </div>

        {/* Right Side: Selected Counter Detail Panel + Activity Rail (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          <CounterDetailPanel />
          <div className="grid grid-cols-1 gap-6">
            <CategoryPerformanceBars />
            <ActivityRail />
          </div>
        </div>
      </div>
    </div>
  );
}

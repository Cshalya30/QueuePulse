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
  const { workspace } = useQueuePulse();

  return (
    <div className="space-y-6">
      {/* Top Header */}
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
            Real-time desk occupancy, queue throughput, and counter controls
          </p>
        </div>
      </div>

      {/* Top Metric Strip */}
      <MetricStrip />

      {/* Main Operational Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Counter Matrix (7 cols on lg) */}
        <div className="lg:col-span-7">
          <CounterMatrix />
        </div>

        {/* Right Side: Selected Counter Detail Panel (5 cols on lg) */}
        <div className="lg:col-span-5">
          <CounterDetailPanel />
        </div>
      </div>

      {/* Secondary Operational Insights: Category SLAs & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-border-subtle">
        <CategoryPerformanceBars />
        <ActivityRail />
      </div>
    </div>
  );
}

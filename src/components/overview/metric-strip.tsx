"use client";

import React from "react";
import { useQueuePulse } from "@/lib/store";
import { MetricCard } from "@/components/ui/metric-card";
import { formatDuration } from "@/lib/utils";
import {
  Layers,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Radio,
} from "lucide-react";

export const MetricStrip: React.FC = () => {
  const { metrics, isDemoMode } = useQueuePulse();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <MetricCard
        label="Active Queues"
        value={`${metrics.activeQueuesCount} / 4`}
        sublabel="Operational counters online"
        icon={<Radio className="w-4 h-4 text-accent-live" />}
        highlight
      />

      <MetricCard
        label="People Waiting"
        value={metrics.totalWaiting}
        delta={{
          value: "+3",
          trend: "up",
          label: "vs previous hour",
        }}
        icon={<Users className="w-4 h-4 text-accent-info" />}
      />

      <MetricCard
        label="Average Wait"
        value={formatDuration(metrics.avgWaitSeconds)}
        delta={{
          value: "-1m 15s",
          trend: "up",
          label: "Target: 15m (SLA)",
        }}
        icon={<Clock className="w-4 h-4 text-accent-warning" />}
      />

      <MetricCard
        label="Served Today"
        value={metrics.servedTodayCount}
        sublabel={`${metrics.slaCompliancePercent}% under 15 min`}
        icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
      />

      <MetricCard
        label="Missed Token Rate"
        value={`${metrics.missedRatePercent}%`}
        delta={{
          value: "-0.8%",
          trend: "up",
          label: "In Grace Buffer: 2",
        }}
        icon={<AlertTriangle className="w-4 h-4 text-accent-warning" />}
      />
    </div>
  );
};

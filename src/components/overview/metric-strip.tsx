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
  const { metrics } = useQueuePulse();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <MetricCard
        label="Active Desks"
        value={`${metrics.activeQueuesCount} / 4`}
        sublabel="Counters online"
        icon={<Radio className="w-4 h-4 text-accent-live" />}
        highlight
      />

      <MetricCard
        label="Total Waiting"
        value={metrics.totalWaiting}
        sublabel="Across all categories"
        icon={<Users className="w-4 h-4 text-accent-info" />}
      />

      <MetricCard
        label="Average Wait"
        value={formatDuration(metrics.avgWaitSeconds)}
        sublabel="SLA Target: < 15m"
        icon={<Clock className="w-4 h-4 text-accent-warning" />}
      />

      <MetricCard
        label="Served Today"
        value={metrics.servedTodayCount}
        sublabel={`${metrics.slaCompliancePercent}% within SLA target`}
        icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
      />

      <MetricCard
        label="Grace Buffer"
        value={metrics.graceQueueCount ?? 0}
        sublabel={`${metrics.missedRatePercent}% missed rate`}
        icon={<AlertTriangle className="w-4 h-4 text-accent-warning" />}
      />
    </div>
  );
};

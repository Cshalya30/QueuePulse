"use client";

import React from "react";
import { BarChart2, CheckCircle2, ArrowRight } from "lucide-react";
import { WaitTimeChart } from "@/components/analytics/wait-time-chart";

export const StageUnderstand: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left: Narrative */}
      <div className="lg:col-span-5 space-y-4">
        <div className="text-xs font-mono font-semibold text-accent-info uppercase tracking-wider">
          Stage 04 · Evidence & Metrics
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Turn raw timestamps into operational evidence.
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Instead of vague estimates, service leadership receives mathematically auditable metrics:
        </p>

        <div className="space-y-3 font-mono text-xs text-text-secondary">
          <div className="p-2.5 bg-surface-2 rounded border border-border-subtle space-y-1">
            <span className="text-accent-live font-semibold">Average Waiting Time:</span>
            <div className="text-text-tertiary text-[11px]">
              Formula: service_started_at - ticket_created_at
            </div>
          </div>

          <div className="p-2.5 bg-surface-2 rounded border border-border-subtle space-y-1">
            <span className="text-accent-info font-semibold">Service Duration:</span>
            <div className="text-text-tertiary text-[11px]">
              Formula: service_completed_at - service_started_at
            </div>
          </div>
        </div>
      </div>

      {/* Right: Chart Visual */}
      <div className="lg:col-span-7 space-y-4">
        <WaitTimeChart />
      </div>
    </div>
  );
};

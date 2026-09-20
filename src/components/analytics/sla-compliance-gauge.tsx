"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export const SlaComplianceGauge: React.FC = () => {
  const [slaTargetMin, setSlaTargetMin] = useState<number>(15);
  const compliancePercent = 91.4;

  return (
    <Card className="bg-surface-1 border-border-subtle shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent-live" />
            <span>Service-Level Compliance (SLA Target)</span>
          </CardTitle>
          <span className="text-[10px] font-mono text-accent-live bg-accent-live/10 border border-accent-live/20 px-1.5 py-0.2 rounded">
            Target: &lt; {slaTargetMin} Min
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold font-mono text-accent-live tabular-nums">
              {compliancePercent}%
            </div>
            <div className="text-xs text-text-secondary mt-0.5">
              130 of 142 tokens started within {slaTargetMin} minutes
            </div>
          </div>

          <div className="w-24 h-24 relative flex items-center justify-center">
            {/* SVG circular progress ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-3"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-accent-live"
                strokeDasharray={`${compliancePercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-mono font-bold text-text-primary">
              {compliancePercent}%
            </span>
          </div>
        </div>

        {/* SLA Target Slider */}
        <div className="p-3 bg-surface-2 rounded-md border border-border-subtle space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-text-secondary">Configured SLA Threshold</span>
            <span className="font-mono text-text-primary">{slaTargetMin} Minutes</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={slaTargetMin}
            onChange={(e) => setSlaTargetMin(Number(e.target.value))}
            className="w-full accent-accent-live h-1.5 bg-surface-3 rounded-lg cursor-pointer"
          />
        </div>
      </CardContent>
    </Card>
  );
};

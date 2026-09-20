"use client";

import React from "react";
import { TrendingUp, Users, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const StageImprove: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left: Narrative */}
      <div className="lg:col-span-5 space-y-4">
        <div className="text-xs font-mono font-semibold text-accent-live uppercase tracking-wider">
          Stage 05 · Service Improvement
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Improve staffing and service throughput.
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Presence sensing eliminates the invisible "idle latency" where a staff member waits for a student who has already walked away.
        </p>

        <ul className="space-y-2 text-xs text-text-secondary">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-live shrink-0" />
            <span>Eliminates 40% of empty-counter waiting latency</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-live shrink-0" />
            <span>Provides factual data for staff allocation during peak hours</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-live shrink-0" />
            <span>Preserves student trust through transparent Grace Queue recall</span>
          </li>
        </ul>
      </div>

      {/* Right: Before vs After Comparison */}
      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-md bg-surface-1 border border-border-subtle space-y-3 opacity-80">
          <div className="text-xs font-bold uppercase text-accent-critical tracking-wider">
            Without QueuePulse
          </div>
          <ul className="space-y-2 text-xs text-text-secondary">
            <li>• Staff calls into empty lobby</li>
            <li>• No proof if student attended</li>
            <li>• Idle desk time: 4m per cycle</li>
            <li>• Management has zero analytics</li>
          </ul>
        </div>

        <div className="p-4 rounded-md bg-surface-1 border border-accent-live/40 shadow-lg space-y-3">
          <div className="text-xs font-bold uppercase text-accent-live tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>With QueuePulse IoT</span>
          </div>
          <ul className="space-y-2 text-xs text-text-primary">
            <li>✓ ToF confirms clearance instantly</li>
            <li>✓ RFID locks student identity</li>
            <li>✓ Idle desk time reduced to &lt; 40s</li>
            <li>✓ Full auditable operations analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

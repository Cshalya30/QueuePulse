"use client";

import React, { useState } from "react";
import { useQueuePulse } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Cpu,
  Layers,
  PhoneCall,
  CheckCircle2,
  Radio,
  AlertCircle,
  Sliders,
  RotateCcw,
} from "lucide-react";

export const HardwareSimulator: React.FC = () => {
  const {
    counters,
    categories,
    selectedCounterId,
    setSelectedCounterId,
    generateToken,
    callNextToken,
    triggerServiceDone,
    triggerClearance,
    triggerRfidTap,
    triggerMissedToken,
    resetToInitialState,
  } = useQueuePulse();

  const activeCounter =
    counters.find((c) => c.id === selectedCounterId) || counters[0];

  return (
    <div className="p-4 bg-surface-1 border border-border-strong rounded-md space-y-3 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-accent-live/15 text-accent-live border border-accent-live/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <span>Interactive Hardware Simulator</span>
              <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 bg-surface-3 text-text-tertiary rounded border border-border-subtle">
                ESP32 + Sensors
              </span>
            </h3>
            <p className="text-[11px] text-text-tertiary">
              Simulate physical button presses, ToF laser distances, and RFID cards on selected counter
            </p>
          </div>
        </div>

        {/* Counter Target Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Target Counter:</span>
          <select
            value={selectedCounterId}
            onChange={(e) => setSelectedCounterId(e.target.value)}
            className="bg-surface-2 border border-border-strong text-text-primary text-xs rounded px-2.5 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-accent-live"
          >
            {counters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulator Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <Button
          size="compact"
          variant="outline"
          onClick={() => generateToken(activeCounter.serviceCategoryId)}
          className="text-xs"
        >
          <Layers className="w-3.5 h-3.5 text-accent-info" />
          + Issue Token
        </Button>

        <Button
          size="compact"
          variant="live"
          onClick={() => callNextToken(activeCounter.id)}
          className="text-xs"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          Call Next
        </Button>

        <Button
          size="compact"
          variant="outline"
          onClick={() => triggerRfidTap(activeCounter.id, undefined, true)}
          className="text-xs"
        >
          <Radio className="w-3.5 h-3.5 text-accent-live" />
          RFID Tap Match
        </Button>

        <Button
          size="compact"
          variant="warning"
          onClick={() => triggerMissedToken(activeCounter.id)}
          className="text-xs"
        >
          <AlertCircle className="w-3.5 h-3.5 text-accent-warning" />
          Missed Timeout
        </Button>

        <Button
          size="compact"
          variant="primary"
          onClick={() => triggerServiceDone(activeCounter.id)}
          className="text-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-accent-live" />
          Service Done
        </Button>

        <Button
          size="compact"
          variant="outline"
          onClick={() => triggerClearance(activeCounter.id, 1400)}
          className="text-xs"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          ToF Clear (1400mm)
        </Button>
      </div>
    </div>
  );
};

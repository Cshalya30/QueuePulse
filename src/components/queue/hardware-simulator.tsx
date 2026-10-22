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
    tokens,
    selectedCounterId,
    setSelectedCounterId,
    generateToken,
    callNextToken,
    triggerServiceDone,
    triggerClearance,
    triggerRfidTap,
    triggerMissedToken,
    resetToInitialState,
    isCounterCallBlocked,
  } = useQueuePulse();

  const activeCounter =
    counters.find((c) => c.id === selectedCounterId) || counters[0];
  const callStatus = isCounterCallBlocked(activeCounter.id);
  const currentToken = tokens.find((t) => t.id === activeCounter.currentTokenId);

  return (
    <div className="p-3 bg-surface-1 border border-border-subtle rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded bg-surface-3 text-accent-live border border-border-subtle shrink-0">
          <Cpu className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary text-xs">
            Hardware Testing Tool:
          </span>
          <select
            value={selectedCounterId}
            onChange={(e) => setSelectedCounterId(e.target.value)}
            className="bg-surface-2 border border-border-strong text-text-primary text-xs rounded px-2 py-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-accent-live"
          >
            {counters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <Button
          size="compact"
          variant="outline"
          onClick={() => generateToken(activeCounter.serviceCategoryId)}
          className="text-xs gap-1"
        >
          <Layers className="w-3 h-3 text-accent-info" />
          <span>+ Print Ticket</span>
        </Button>

        <Button
          size="compact"
          variant="outline"
          onClick={() => triggerClearance(activeCounter.id, 1400)}
          className="text-xs gap-1"
        >
          <Sliders className="w-3 h-3 text-emerald-400" />
          <span>Simulate Clear (1400mm)</span>
        </Button>

        <Button
          size="compact"
          variant="ghost"
          onClick={resetToInitialState}
          className="text-xs text-text-tertiary hover:text-text-primary gap-1"
          title="Reset to default data"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </Button>
      </div>
    </div>
  );
};

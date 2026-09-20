"use client";

import React, { useState } from "react";
import { Cpu, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATE_NODES = [
  { id: "WAITING", label: "1. Token Waiting", desc: "FIFO Normal or Grace Buffer", color: "#a6aeb8" },
  { id: "CALLED", label: "2. Token Called", desc: "OLED active, buzzer, 60s window", color: "#7cc8ff" },
  { id: "VERIFIED", label: "3. RFID Verified", desc: "Card matches session -> In Service", color: "#b8ef79" },
  { id: "SERVICE_DONE", label: "4. Service Done", desc: "Staff button pressed, clock stops", color: "#e8b35c" },
  { id: "CLEARANCE", label: "5. ToF Clearance", desc: "Laser confirms exit (>800mm)", color: "#b8ef79" },
];

export const StageDecide: React.FC = () => {
  const [activeStateIndex, setActiveStateIndex] = useState<number>(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left: Narrative */}
      <div className="lg:col-span-5 space-y-4">
        <div className="text-xs font-mono font-semibold text-accent-info uppercase tracking-wider">
          Stage 02 · Edge Determinism
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Decide locally at the ESP32 edge.
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          The physical counter cannot be stalled by internet dropouts or API latency. The ESP32 node executes an autonomous Moore state machine right at the desk:
        </p>

        <ul className="space-y-2.5 text-xs text-text-secondary">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-info mt-1.5 shrink-0" />
            <span>
              <strong className="text-text-primary">No Cloud Dependency for Queue Steps:</strong> Calling next token, validating RFID, and measuring presence execute instantaneously on silicon.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-live mt-1.5 shrink-0" />
            <span>
              <strong className="text-text-primary">Verification Before Service:</strong> Prevents false "service started" records if a student is called but hasn't arrived.
            </span>
          </li>
        </ul>
      </div>

      {/* Right: State Machine Visualizer */}
      <div className="lg:col-span-7 bg-surface-1 border border-border-strong rounded-lg p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <span className="text-xs font-mono font-semibold text-text-primary flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-accent-info" />
            <span>ESP32 Finite State Machine Flow</span>
          </span>
          <Button
            size="compact"
            variant="outline"
            onClick={() => setActiveStateIndex((prev) => (prev + 1) % STATE_NODES.length)}
            className="text-xs"
          >
            Advance Transition →
          </Button>
        </div>

        {/* State nodes stack */}
        <div className="space-y-2.5">
          {STATE_NODES.map((node, i) => {
            const isCurrent = activeStateIndex === i;
            return (
              <div
                key={node.id}
                onClick={() => setActiveStateIndex(i)}
                className={`p-3 rounded-md border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isCurrent
                    ? "bg-surface-3 border-accent-live/50 shadow-md ring-1 ring-accent-live/30"
                    : "bg-surface-2/40 border-border-subtle opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: node.color }}
                  />
                  <div>
                    <div className="font-semibold text-xs text-text-primary font-mono">
                      {node.label}
                    </div>
                    <div className="text-[11px] text-text-tertiary">
                      {node.desc}
                    </div>
                  </div>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-mono font-bold text-accent-live bg-accent-live/10 border border-accent-live/25 px-2 py-0.5 rounded">
                    ACTIVE STATE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

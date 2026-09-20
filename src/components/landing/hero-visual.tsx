"use client";

import React from "react";
import { Radio, Cpu, Activity, Wifi, ShieldCheck, CheckCircle2 } from "lucide-react";

export const HeroVisual: React.FC = () => {
  return (
    <div className="relative w-full max-w-xl mx-auto aspect-[16/11] bg-surface-1 border border-border-strong rounded-xl p-5 shadow-2xl overflow-hidden flex flex-col justify-between select-none">
      {/* Background grid */}
      <div className="absolute inset-0 bg-tech-dots opacity-40 pointer-events-none" />

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-live animate-ping" />
          <span className="text-xs font-mono font-bold text-text-primary">
            ESP32-NODE-DOC-01 · Active
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-text-tertiary">
          <span>RSSI -52 dBm</span>
          <span>·</span>
          <span className="text-accent-live">Live Sync</span>
        </div>
      </div>

      {/* Center: Interactive Counter Scene Layout */}
      <div className="relative z-10 grid grid-cols-3 gap-3 my-auto font-mono">
        {/* 1. Kiosk & Student */}
        <div className="p-3 bg-surface-2 rounded-md border border-border-subtle flex flex-col items-center justify-center text-center space-y-1">
          <div className="p-1.5 rounded-full bg-accent-info/10 text-accent-info">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-[10px] text-text-tertiary">Student Card</span>
          <span className="text-xs font-bold text-text-primary">DOC-024</span>
          <span className="text-[9px] text-accent-info">UID: 9A-C4-12</span>
        </div>

        {/* 2. ESP32 Counter Node */}
        <div className="p-3 bg-surface-3 rounded-md border border-accent-live/40 shadow-lg flex flex-col items-center justify-center text-center space-y-1">
          <div className="p-1.5 rounded-full bg-accent-live/15 text-accent-live">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-text-tertiary">Desk Node</span>
          <span className="text-xs font-bold text-accent-live">Counter 1</span>
          <span className="text-[9px] text-text-secondary">ToF: 440mm</span>
        </div>

        {/* 3. Cloud Database & Dashboard */}
        <div className="p-3 bg-surface-2 rounded-md border border-border-subtle flex flex-col items-center justify-center text-center space-y-1">
          <div className="p-1.5 rounded-full bg-accent-warning/10 text-accent-warning">
            <Wifi className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-text-tertiary">Cloud Stream</span>
          <span className="text-xs font-bold text-text-primary">Supabase</span>
          <span className="text-[9px] text-emerald-400">14ms RTT</span>
        </div>
      </div>

      {/* Bottom Status Chip */}
      <div className="relative z-10 p-2.5 bg-surface-2/70 border border-border-subtle rounded-md flex items-center justify-between text-xs font-mono">
        <span className="text-text-secondary flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-accent-live" />
          <span>Status: Token DOC-024 Authenticated In Service</span>
        </span>
        <span className="text-accent-live font-bold tabular-nums">11m 40s</span>
      </div>
    </div>
  );
};

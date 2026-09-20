"use client";

import React from "react";
import { Cpu, Radio, Activity, Wifi, Database, LayoutDashboard, BarChart3, ArrowRight } from "lucide-react";

export const SystemDiagram: React.FC = () => {
  return (
    <div className="p-6 sm:p-8 bg-surface-1 border border-border-strong rounded-xl space-y-6 shadow-2xl relative overflow-hidden">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
          Physical-to-Cloud Connected Infrastructure
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary">
          High-reliability hardware pipeline connecting physical student arrival with real-time operations visibility
        </p>
      </div>

      {/* Stripe-style systems diagram visual nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs pt-4">
        {/* Step 1 */}
        <div className="p-4 bg-surface-2 rounded-md border border-border-subtle space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-tertiary">01 · PERCEPTION</span>
            <Activity className="w-4 h-4 text-accent-live" />
          </div>
          <div className="font-bold text-sm text-text-primary">Sensors & Controls</div>
          <p className="text-[11px] font-sans text-text-secondary">
            VL53L0X ToF laser distance + RC522 RFID 13.56MHz + Tactile service buttons.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-4 bg-surface-3 rounded-md border border-accent-live/40 space-y-2 relative shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-accent-live">02 · EDGE AUTHORITY</span>
            <Cpu className="w-4 h-4 text-accent-live" />
          </div>
          <div className="font-bold text-sm text-text-primary">ESP32 State Machine</div>
          <p className="text-[11px] font-sans text-text-secondary">
            Runs local queue transitions, OLED display, and offline SPIFFS flash buffer.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-4 bg-surface-2 rounded-md border border-border-subtle space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-tertiary">03 · TELEMETRY</span>
            <Database className="w-4 h-4 text-accent-info" />
          </div>
          <div className="font-bold text-sm text-text-primary">Supabase Cloud DB</div>
          <p className="text-[11px] font-sans text-text-secondary">
            PostgreSQL event logging, Row Level Security, and Realtime websocket pub/sub.
          </p>
        </div>

        {/* Step 4 */}
        <div className="p-4 bg-surface-2 rounded-md border border-border-subtle space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-tertiary">04 · OPERATIONS</span>
            <LayoutDashboard className="w-4 h-4 text-accent-warning" />
          </div>
          <div className="font-bold text-sm text-text-primary">Live Web App</div>
          <p className="text-[11px] font-sans text-text-secondary">
            Split-pane counter matrix, live queue orchestration, and SLA analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

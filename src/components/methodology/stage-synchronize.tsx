"use client";

import React, { useState } from "react";
import { Wifi, Database, LayoutDashboard, Cloud, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StageSynchronize: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [bufferedEvents, setBufferedEvents] = useState<number>(0);

  const toggleNetwork = () => {
    if (isOnline) {
      setIsOnline(false);
      setBufferedEvents(3);
    } else {
      setIsOnline(true);
      setBufferedEvents(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left: Narrative */}
      <div className="lg:col-span-5 space-y-4">
        <div className="text-xs font-mono font-semibold text-accent-warning uppercase tracking-wider">
          Stage 03 · Telemetry Synchronization
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Synchronize without compromising local authority.
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Operational telemetry flows asynchronously from the ESP32 node into Supabase PostgreSQL and the live web dashboard. If Wi-Fi drops, operations do not fail:
        </p>

        <ul className="space-y-2.5 text-xs text-text-secondary">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-warning mt-1.5 shrink-0" />
            <span>
              <strong className="text-text-primary">SPIFFS Flash Queue Buffer:</strong> Events generated during an outage are cached with local hardware timestamps and batch-replayed once the uplink recovers.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-live mt-1.5 shrink-0" />
            <span>
              <strong className="text-text-primary">Zero Live Faking:</strong> The dashboard explicitly reports "Offline · Stale" rather than fabricating artificial live status.
            </span>
          </li>
        </ul>
      </div>

      {/* Right: Pipeline Visualizer */}
      <div className="lg:col-span-7 bg-surface-1 border border-border-strong rounded-lg p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <span className="text-xs font-mono font-semibold text-text-primary flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-accent-warning" />
            <span>Edge-to-Cloud Telemetry Pipeline</span>
          </span>
          <Button
            size="compact"
            variant={isOnline ? "outline" : "live"}
            onClick={toggleNetwork}
            className="text-xs"
          >
            {isOnline ? "Simulate Wi-Fi Disconnect" : "Restore Wi-Fi Uplink"}
          </Button>
        </div>

        {/* 3 Pipeline Nodes */}
        <div className="grid grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-surface-2 rounded-md border border-border-subtle text-center space-y-1">
            <div className="text-[10px] text-text-tertiary">1. ESP32 Node</div>
            <div className="font-bold text-text-primary">DOC-01</div>
            <div className="text-[10px] text-accent-live">Local Buffer: {bufferedEvents}</div>
          </div>

          <div
            className={`p-3 rounded-md border text-center space-y-1 transition-all ${
              isOnline
                ? "bg-accent-live/10 border-accent-live/30 text-accent-live"
                : "bg-accent-critical/10 border-accent-critical/30 text-accent-critical"
            }`}
          >
            <div className="text-[10px]">2. Wi-Fi Uplink</div>
            <div className="font-bold">{isOnline ? "ONLINE" : "DISRUPTED"}</div>
            <div className="text-[10px]">{isOnline ? "-52 dBm" : "0 packets"}</div>
          </div>

          <div className="p-3 bg-surface-2 rounded-md border border-border-subtle text-center space-y-1">
            <div className="text-[10px] text-text-tertiary">3. Cloud Database</div>
            <div className="font-bold text-text-primary">Supabase</div>
            <div className="text-[10px] text-accent-info">Realtime Pub/Sub</div>
          </div>
        </div>

        <div className="p-3 bg-surface-2/60 rounded border border-border-subtle text-xs text-text-secondary">
          {isOnline ? (
            <span className="text-accent-live font-mono">
              ✓ Telemetry stream synchronizing in real time (latency ~18ms).
            </span>
          ) : (
            <span className="text-accent-warning font-mono">
              ⚠ Wi-Fi link down. ESP32 saving events to local SPIFFS flash. Zero data loss.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

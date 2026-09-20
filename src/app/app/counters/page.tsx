"use client";

import React, { useState } from "react";
import { useQueuePulse } from "@/lib/store";
import { CounterDeviceCard } from "@/components/counters/counter-device-card";
import { DeviceDiagnosticsDrawer } from "@/components/counters/device-diagnostics-drawer";
import { Cpu, Wifi, Radio, ShieldCheck, Activity } from "lucide-react";

export default function CountersPage() {
  const { counters, devices, categories, tokens, toggleDeviceOnline } = useQueuePulse();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const onlineCount = devices.filter((d) => d.online).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Counters & Hardware Nodes</span>
            <span className="text-xs px-2 py-0.5 rounded bg-accent-live/15 text-accent-live font-mono font-semibold border border-accent-live/30">
              {onlineCount}/{devices.length} Nodes Online
            </span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Physical ESP32 edge telemetry, VL53L0X ToF laser distance, and Wi-Fi link diagnostics
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-text-tertiary">
          <span className="flex items-center gap-1.5 text-accent-live">
            <span className="w-2 h-2 rounded-full bg-accent-live animate-pulse" />
            <span>Telemetry Active</span>
          </span>
          <span>·</span>
          <span>Heartbeat: 2s Interval</span>
        </div>
      </div>

      {/* Grid of Counter & Hardware Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {counters.map((counter) => {
          const device = devices.find((d) => d.id === counter.deviceId);
          const category = categories.find((c) => c.id === counter.serviceCategoryId);
          const currentToken = tokens.find((t) => t.id === counter.currentTokenId);

          return (
            <CounterDeviceCard
              key={counter.id}
              counter={counter}
              device={device}
              category={category}
              currentToken={currentToken}
              onOpenDiagnostics={(devId) => setSelectedDeviceId(devId)}
              onToggleOnline={toggleDeviceOnline}
            />
          );
        })}
      </div>

      {/* Diagnostics Drawer */}
      <DeviceDiagnosticsDrawer
        deviceId={selectedDeviceId}
        onClose={() => setSelectedDeviceId(null)}
      />
    </div>
  );
}

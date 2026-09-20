"use client";

import React from "react";
import { Counter, Device, ServiceCategory, Token } from "@/types/queuepulse";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TofGauge } from "@/components/ui/tof-gauge";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import {
  Cpu,
  Wifi,
  Radio,
  Clock,
  Activity,
  User,
  Sliders,
  AlertTriangle,
  Battery,
  ShieldCheck,
} from "lucide-react";

interface CounterDeviceCardProps {
  counter: Counter;
  device?: Device;
  category?: ServiceCategory;
  currentToken?: Token;
  onOpenDiagnostics: (deviceId: string) => void;
  onToggleOnline: (deviceId: string) => void;
}

export const CounterDeviceCard: React.FC<CounterDeviceCardProps> = ({
  counter,
  device,
  category,
  currentToken,
  onOpenDiagnostics,
  onToggleOnline,
}) => {
  const isOnline = Boolean(device?.online);

  return (
    <Card
      className={`border transition-all ${
        isOnline
          ? "border-border-subtle bg-surface-1 hover:border-border-strong"
          : "border-accent-critical/30 bg-accent-critical/[0.03]"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold px-2 py-0.5 bg-surface-3 text-text-primary rounded border border-border-strong">
              {counter.code}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full border text-[11px]"
              style={{
                color: category?.color || "#b8ef79",
                borderColor: `${category?.color || "#b8ef79"}33`,
                backgroundColor: `${category?.color || "#b8ef79"}12`,
              }}
            >
              {category?.name}
            </span>
          </div>

          <Badge variant={isOnline ? "live" : "critical"} dot>
            {isOnline ? "Node Online" : "Offline / Stale"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Hardware Node Telemetry Block */}
        <div className="p-3 bg-surface-2 rounded-md border border-border-subtle space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent-live" />
              <span>{device?.deviceCode || "ESP32-NODE"}</span>
            </span>
            <span className="text-[10px] text-text-tertiary">
              {device?.firmwareVersion || "v2.4.1"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border-subtle/50 text-[11px] text-text-tertiary">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-accent-info" />
              <span>{isOnline ? `${device?.wifiSignalRssi} dBm` : "No Signal"}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Clock className="w-3 h-3 text-text-tertiary" />
              <span>Seen: {formatRelativeTime(device?.lastSeenAt)}</span>
            </div>
          </div>
        </div>

        {/* Current Active Token & Operator */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-text-tertiary">
              Active Desk Session
            </span>
            <div className="font-mono font-bold text-text-primary text-sm mt-0.5">
              {currentToken ? currentToken.tokenCode : "— Clear —"}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-text-tertiary">
              Staff In-Charge
            </span>
            <div className="text-text-secondary truncate mt-0.5">
              {counter.staffName || "Desk Staff"}
            </div>
          </div>
        </div>

        {/* ToF Distance Gauge */}
        <div>
          <TofGauge
            distanceMm={counter.currentDistanceMm}
            thresholdMm={counter.distanceThresholdMm}
            state={counter.occupancyState}
          />
        </div>

        {/* Actions Footer */}
        <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-2">
          {device && (
            <button
              onClick={() => onToggleOnline(device.id)}
              className={`text-[11px] font-mono px-2 py-1 rounded border transition-colors ${
                isOnline
                  ? "text-text-tertiary hover:text-accent-critical hover:bg-accent-critical/10 border-border-subtle"
                  : "text-accent-live bg-accent-live/10 border-accent-live/30 font-semibold"
              }`}
            >
              {isOnline ? "Simulate Drop" : "Restore Wi-Fi"}
            </button>
          )}

          {device && (
            <Button
              size="compact"
              variant="outline"
              onClick={() => onOpenDiagnostics(device.id)}
              className="text-xs"
            >
              Node Diagnostics →
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

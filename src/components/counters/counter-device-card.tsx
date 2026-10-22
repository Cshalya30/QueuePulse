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

      <CardContent className="space-y-3.5 pt-1">
        {/* Active Customer & Staff */}
        <div className="p-3 bg-surface-2 rounded-md border border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-text-tertiary block">
              Active Serving Token
            </span>
            <div className="font-mono font-bold text-text-primary text-base mt-0.5">
              {currentToken ? currentToken.tokenCode : "— Clear —"}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-text-tertiary block">
              Staff In-Charge
            </span>
            <div className="text-xs text-text-secondary mt-0.5 font-medium truncate max-w-[120px]">
              {counter.staffName || "Desk Staff"}
            </div>
          </div>
        </div>

        {/* Presence & Link Telemetry */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 bg-surface-2/60 rounded border border-border-subtle">
            <span className="text-[10px] uppercase text-text-tertiary block font-sans">
              Laser Presence
            </span>
            <div className="mt-1 font-semibold text-text-primary flex items-center gap-1.5">
              {counter.occupancyState === "OCCUPIED" ||
              counter.currentDistanceMm < counter.distanceThresholdMm ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-live shrink-0" />
                  <span className="text-accent-live">{counter.currentDistanceMm}mm</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary shrink-0" />
                  <span className="text-text-secondary">Clear ({counter.currentDistanceMm}mm)</span>
                </>
              )}
            </div>
          </div>

          <div className="p-2.5 bg-surface-2/60 rounded border border-border-subtle">
            <span className="text-[10px] uppercase text-text-tertiary block font-sans">
              Wi-Fi Link
            </span>
            <div className="mt-1 font-semibold text-text-primary flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-accent-info shrink-0" />
              <span>{isOnline ? `${device?.wifiSignalRssi || -55} dBm` : "No Signal"}</span>
            </div>
          </div>
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
              {isOnline ? "Simulate Disconnect" : "Restore Link"}
            </button>
          )}

          {device && (
            <Button
              size="compact"
              variant="outline"
              onClick={() => onOpenDiagnostics(device.id)}
              className="text-xs"
            >
              Diagnostics →
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

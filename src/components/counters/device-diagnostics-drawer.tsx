"use client";

import React, { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { useQueuePulse } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration, formatTime, formatRelativeTime } from "@/lib/utils";
import {
  Cpu,
  Wifi,
  Battery,
  ShieldCheck,
  Activity,
  Terminal,
  RotateCcw,
  Zap,
} from "lucide-react";

interface DeviceDiagnosticsDrawerProps {
  deviceId: string | null;
  onClose: () => void;
}

export const DeviceDiagnosticsDrawer: React.FC<DeviceDiagnosticsDrawerProps> = ({
  deviceId,
  onClose,
}) => {
  const { devices, counters, telemetryHistory, toggleDeviceOnline } = useQueuePulse();
  const [pingRunning, setPingRunning] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const device = devices.find((d) => d.id === deviceId);
  const counter = counters.find((c) => c.deviceId === deviceId);
  const nodeTelemetry = telemetryHistory.filter((t) => t.deviceId === deviceId);

  if (!device) return null;

  const handleTestPing = () => {
    setPingRunning(true);
    setPingResult(null);
    setTimeout(() => {
      setPingRunning(false);
      setPingResult(`Ping ACK 200 OK: RTT 14ms (ESP32 SPIFFS buffer sync: 0 uncommitted)`);
    }, 600);
  };

  return (
    <Drawer
      isOpen={Boolean(deviceId)}
      onClose={onClose}
      title={device.deviceCode}
      subtitle={`Node attached to Counter: ${counter?.code || "Unassigned"}`}
      width="lg"
    >
      {/* Status Banner */}
      <div className="p-4 bg-surface-2 border border-border-subtle rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-semibold text-text-tertiary">
            Telemetry Status
          </span>
          <Badge variant={device.online ? "live" : "critical"} dot>
            {device.online ? "Connected · Real-time" : "Disconnected"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
          <div>
            <span className="text-text-tertiary block text-[10px]">Wi-Fi RSSI</span>
            <span className="text-text-primary font-bold text-sm">
              {device.online ? `${device.wifiSignalRssi} dBm (Strong)` : "—"}
            </span>
          </div>

          <div>
            <span className="text-text-tertiary block text-[10px]">Firmware</span>
            <span className="text-text-primary font-bold text-sm">
              {device.firmwareVersion}
            </span>
          </div>

          <div>
            <span className="text-text-tertiary block text-[10px]">IP Address</span>
            <span className="text-text-primary font-bold">
              {device.ipAddress || "192.168.1.101"}
            </span>
          </div>

          <div>
            <span className="text-text-tertiary block text-[10px]">Uptime</span>
            <span className="text-text-primary font-bold">
              {formatDuration(device.uptimeSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Node Diagnostics Controls */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Edge Hardware Commands
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTestPing}
            isLoading={pingRunning}
            className="text-xs gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-accent-live" />
            Send Test Ping
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleDeviceOnline(device.id)}
            className="text-xs gap-1.5"
          >
            <Wifi className="w-3.5 h-3.5 text-accent-info" />
            {device.online ? "Simulate Disconnect" : "Restore Link"}
          </Button>
        </div>

        {pingResult && (
          <div className="p-2.5 rounded bg-surface-3 border border-border-strong font-mono text-xs text-accent-live">
            {pingResult}
          </div>
        )}
      </div>

      {/* Recent Telemetry Stream */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center justify-between">
          <span>Recent Sensor Telemetry Stream</span>
          <span className="text-[10px] font-mono text-text-tertiary">
            VL53L0X Laser Distance mm
          </span>
        </h4>

        <div className="space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto pr-1">
          {nodeTelemetry.map((t) => (
            <div
              key={t.id}
              className="p-2 rounded bg-surface-2 border border-border-subtle flex items-center justify-between text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-accent-info font-bold">{t.distanceMm}mm</span>
                <span
                  className={
                    t.occupancyState === "OCCUPIED"
                      ? "text-accent-live"
                      : "text-text-tertiary"
                  }
                >
                  ({t.occupancyState})
                </span>
              </div>
              <span className="text-text-tertiary">
                {formatTime(t.recordedAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
};

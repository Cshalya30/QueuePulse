"use client";

import React, { useState } from "react";
import { useQueuePulse } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Cpu,
  Radio,
  Sliders,
  Database,
  Save,
  CheckCircle2,
  Key,
} from "lucide-react";

export default function SettingsPage() {
  const { workspace, categories } = useQueuePulse();
  const [tofThresholdMm, setTofThresholdMm] = useState<number>(800);
  const [responseWindowSec, setResponseWindowSec] = useState<number>(60);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Workspace & Hardware Settings</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure presence thresholds, RFID verification windows, and API endpoints
          </p>
        </div>

        <Button
          size="sm"
          variant="live"
          onClick={handleSave}
          className="text-xs gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Parameters</span>
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-accent-live/15 border border-accent-live/40 rounded-md text-accent-live text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Hardware parameters committed and broadcast to ESP32 nodes!</span>
        </div>
      )}

      {/* Hardware Thresholds */}
      <Card className="bg-surface-1 border-border-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent-live" />
            <span>VL53L0X ToF & RC522 RFID Calibration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-text-primary">
                Counter Clearance Distance Threshold (mm)
              </label>
              <span className="font-mono text-accent-live font-bold">
                {tofThresholdMm} mm
              </span>
            </div>
            <input
              type="range"
              min="400"
              max="1500"
              step="50"
              value={tofThresholdMm}
              onChange={(e) => setTofThresholdMm(Number(e.target.value))}
              className="w-full accent-accent-live h-1.5 bg-surface-3 rounded cursor-pointer"
            />
            <p className="text-[11px] text-text-tertiary">
              When distance exceeds {tofThresholdMm}mm, ESP32 considers desk clear and advances state machine.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-border-subtle">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-text-primary">
                RFID Call Response Window (Seconds)
              </label>
              <span className="font-mono text-accent-info font-bold">
                {responseWindowSec} s
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="120"
              step="5"
              value={responseWindowSec}
              onChange={(e) => setResponseWindowSec(Number(e.target.value))}
              className="w-full accent-accent-info h-1.5 bg-surface-3 rounded cursor-pointer"
            />
            <p className="text-[11px] text-text-tertiary">
              Time allowed for student to approach and tap RFID card before moving token to Grace Queue.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Categories Configuration */}
      <Card className="bg-surface-1 border-border-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent-info" />
            <span>Service Categories & SLA Targets</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3 bg-surface-2 rounded border border-border-subtle flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <div>
                  <div className="font-bold text-text-primary">
                    {cat.name} ({cat.prefix})
                  </div>
                  <div className="text-[11px] text-text-tertiary">
                    {cat.description}
                  </div>
                </div>
              </div>
              <div className="font-mono text-text-secondary">
                SLA: {Math.round(cat.slaTargetSeconds / 60)} min
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* API & Supabase Telemetry Ingestion Endpoints */}
      <Card className="bg-surface-1 border-border-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-accent-warning" />
            <span>ESP32 Telemetry REST Ingestion Endpoints</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-1 font-mono text-xs">
          <div className="p-3 bg-surface-2 rounded border border-border-subtle space-y-1">
            <div className="text-text-tertiary text-[10px]">POST Telemetry Stream:</div>
            <div className="text-accent-live font-semibold">
              https://queuepulse.vercel.app/api/telemetry
            </div>
          </div>

          <div className="p-3 bg-surface-2 rounded border border-border-subtle space-y-1">
            <div className="text-text-tertiary text-[10px]">POST Hardware Events:</div>
            <div className="text-accent-info font-semibold">
              https://queuepulse.vercel.app/api/events
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

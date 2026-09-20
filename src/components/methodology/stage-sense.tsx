"use client";

import React, { useState } from "react";
import { Radio, Activity, Sliders, ShieldCheck, Zap } from "lucide-react";
import { TofGauge } from "@/components/ui/tof-gauge";
import { RfidIndicator } from "@/components/ui/rfid-indicator";
import { Button } from "@/components/ui/button";

export const StageSense: React.FC = () => {
  const [distanceMm, setDistanceMm] = useState<number>(440);
  const [rfidTapped, setRfidTapped] = useState<boolean>(true);
  const [simUid, setSimUid] = useState<string>("9A-C4-12-88");

  const isClear = distanceMm >= 800;

  const handleTap = () => {
    setRfidTapped(true);
    setSimUid(`4B-${Math.floor(Math.random() * 89 + 10)}-${Math.floor(Math.random() * 89 + 10)}-E1`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left: Narrative */}
      <div className="lg:col-span-5 space-y-4">
        <div className="text-xs font-mono font-semibold text-accent-live uppercase tracking-wider">
          Stage 01 · Physical Perception
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Sense the counter in the physical world.
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Traditional queue systems rely entirely on staff manual inputs. QueuePulse equips each counter desk with hardware sensors that observe real physical conditions:
        </p>

        <ul className="space-y-2.5 text-xs text-text-secondary">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-live mt-1.5 shrink-0" />
            <span>
              <strong className="text-text-primary">VL53L0X Time-of-Flight Laser:</strong> Measures photon flight time to determine if a student is physically at the desk within millimeter precision.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-info mt-1.5 shrink-0" />
            <span>
              <strong className="text-text-primary">RC522 13.56 MHz RFID Reader:</strong> Authenticates the arriving student smartcard against the active ticket session before starting the service clock.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-warning mt-1.5 shrink-0" />
            <span>
              <strong className="text-text-primary">Staff Input Controls:</strong> Industrial tactile push buttons capture Service Done triggers with microsecond debounce accuracy.
            </span>
          </li>
        </ul>
      </div>

      {/* Right: Interactive Hardware Sensor Bench */}
      <div className="lg:col-span-7 bg-surface-1 border border-border-strong rounded-lg p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <span className="text-xs font-mono font-semibold text-text-primary flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-accent-live" />
            <span>Interactive Edge Sensor Bench</span>
          </span>
          <span className="text-[10px] font-mono text-accent-live bg-accent-live/10 px-2 py-0.5 rounded border border-accent-live/25">
            Real-time I2C / SPI Emulation
          </span>
        </div>

        {/* Live ToF Laser Distance Controller */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-secondary">
              1. Adjust VL53L0X Distance (Desk Presence)
            </span>
            <span className="font-mono text-accent-live font-bold">
              {distanceMm} mm ({isClear ? "CLEAR" : "OCCUPIED"})
            </span>
          </div>

          <input
            type="range"
            min="150"
            max="1600"
            step="20"
            value={distanceMm}
            onChange={(e) => setDistanceMm(Number(e.target.value))}
            className="w-full accent-accent-live h-1.5 bg-surface-3 rounded cursor-pointer"
          />

          <TofGauge
            distanceMm={distanceMm}
            thresholdMm={800}
            state={isClear ? "CLEAR" : "OCCUPIED"}
          />
        </div>

        {/* RFID Tap Simulation */}
        <div className="pt-2 border-t border-border-subtle space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-secondary">
              2. RC522 RFID Smartcard Tap
            </span>
            <Button size="compact" variant="live" onClick={handleTap} className="text-xs">
              Tap Student Card
            </Button>
          </div>

          <RfidIndicator verified={rfidTapped} uid={simUid} />
        </div>
      </div>
    </div>
  );
};

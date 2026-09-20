"use client";

import React from "react";
import { Cpu, Radio, Activity, BarChart3, ShieldCheck, CheckCircle2 } from "lucide-react";

export const CapabilityCards: React.FC = () => {
  const capabilities = [
    {
      icon: Cpu,
      title: "Local-First Edge Control",
      description:
        "The ESP32 runs the authoritative queue state machine. If campus Wi-Fi drops, counter operations continue uninterrupted.",
      badge: "Zero Latency",
      color: "#b8ef79",
    },
    {
      icon: Activity,
      title: "Presence-Aware Clearance",
      description:
        "VL53L0X Time-of-Flight laser verifies physical student departure before unlocking the desk for the next ticket call.",
      badge: "Laser Accuracy",
      color: "#7cc8ff",
    },
    {
      icon: Radio,
      title: "RFID Response Verification",
      description:
        "Students tap their campus card upon arrival. The system authenticates identity and starts the service duration clock with precision.",
      badge: "13.56 MHz NFC",
      color: "#e8b35c",
    },
    {
      icon: BarChart3,
      title: "Auditable Service Analytics",
      description:
        "Every event is timestamped on hardware. Leadership gains factual metrics on wait times, service duration, and missed token rates.",
      badge: "SLA Reports",
      color: "#d08770",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {capabilities.map((cap, i) => {
        const Icon = cap.icon;
        return (
          <div
            key={i}
            className="p-5 rounded-lg bg-surface-1 border border-border-subtle hover:border-border-strong hover:bg-surface-2/40 transition-all space-y-3 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className="p-2 rounded bg-surface-3 border border-border-subtle group-hover:scale-105 transition-transform"
                  style={{ color: cap.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-3 text-text-tertiary border border-border-subtle">
                  {cap.badge}
                </span>
              </div>

              <h4 className="text-base font-semibold text-text-primary">
                {cap.title}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                {cap.description}
              </p>
            </div>

            <div className="pt-2 border-t border-border-subtle/50 text-[11px] font-mono text-accent-live">
              Learn more in methodology →
            </div>
          </div>
        );
      })}
    </div>
  );
};

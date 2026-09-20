"use client";

import React, { useState, useEffect } from "react";
import { useQueuePulse } from "@/lib/store";
import {
  Radio,
  PlayCircle,
  RefreshCw,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEMO_SCENARIOS } from "@/lib/mock-data";

interface AppTopbarProps {
  onOpenScenarioModal: () => void;
}

export const AppTopbar: React.FC<AppTopbarProps> = ({ onOpenScenarioModal }) => {
  const {
    workspace,
    isDemoMode,
    setIsDemoMode,
    resetToInitialState,
    activeScenarioId,
    activeScenarioStep,
    nextScenarioStep,
    resetScenario,
    devices,
  } = useQueuePulse();

  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const onlineDevicesCount = devices.filter((d) => d.online).length;
  const currentScenario = DEMO_SCENARIOS.find((s) => s.id === activeScenarioId);

  return (
    <header className="h-14 bg-surface-1 border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 select-none">
      {/* Workspace identity */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-semibold text-text-primary tracking-tight">
              {workspace.name}
            </h1>
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-text-tertiary font-mono">
              · {workspace.location}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-secondary">
            <span className="flex items-center gap-1 text-accent-live">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-live animate-ping" />
              <span>Live Operational Telemetry</span>
            </span>
            <span className="text-text-tertiary">·</span>
            <span className="font-mono tabular-nums text-text-tertiary">
              {onlineDevicesCount}/{devices.length} Nodes Online
            </span>
          </div>
        </div>
      </div>

      {/* Active Demo Scenario Strip if running */}
      {currentScenario && (
        <div className="hidden xl:flex items-center gap-2.5 px-3 py-1 bg-accent-live/10 border border-accent-live/30 rounded-sm">
          <Flame className="w-3.5 h-3.5 text-accent-live animate-pulse" />
          <div className="text-xs">
            <span className="text-text-secondary font-medium mr-1">
              Demo Step {activeScenarioStep}/{currentScenario.stepsCount}:
            </span>
            <span className="text-text-primary font-semibold">
              {currentScenario.steps[activeScenarioStep - 1]?.title}
            </span>
          </div>
          <Button
            size="compact"
            variant="live"
            onClick={nextScenarioStep}
            className="ml-2 text-xs"
          >
            {currentScenario.steps[activeScenarioStep - 1]?.actionLabel || "Next"}
          </Button>
          <Button
            size="compact"
            variant="ghost"
            onClick={resetScenario}
            className="text-xs text-text-tertiary hover:text-text-primary"
          >
            Exit
          </Button>
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Scenario Player Button */}
        <Button
          size="sm"
          variant="secondary"
          onClick={onOpenScenarioModal}
          className="text-xs gap-1.5 border-border-strong hover:border-accent-live/40"
        >
          <PlayCircle className="w-3.5 h-3.5 text-accent-live" />
          <span className="hidden sm:inline">Guided Demo</span>
        </Button>

        {/* Demo / Live Switcher */}
        <div className="flex items-center bg-surface-2 border border-border-subtle rounded-sm p-0.5 text-xs">
          <button
            onClick={() => setIsDemoMode(true)}
            className={`px-2 py-0.5 rounded-sm font-medium transition-all ${
              isDemoMode
                ? "bg-surface-3 text-text-primary border border-border-strong shadow-xs"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Demo Mode
          </button>
          <button
            onClick={() => setIsDemoMode(false)}
            className={`px-2 py-0.5 rounded-sm font-medium transition-all ${
              !isDemoMode
                ? "bg-accent-live/15 text-accent-live border border-accent-live/30 font-semibold"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Connected
          </button>
        </div>

        {/* Refresh / Reset button */}
        <button
          onClick={resetToInitialState}
          title="Reset sample data"
          className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Live Clock */}
        <div className="hidden md:flex flex-col text-right font-mono tabular-nums text-xs">
          <span className="text-text-primary font-semibold">{currentTime}</span>
          <span className="text-[10px] text-text-tertiary">UTC+05:30</span>
        </div>
      </div>
    </header>
  );
};

"use client";

import React, { useState } from "react";
import { useQueuePulse } from "@/lib/store";
import { DEMO_SCENARIOS } from "@/lib/mock-data";
import {
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Radio,
  Activity,
  ArrowRight,
  Flame,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DemoScenarioControllerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoScenarioController: React.FC<DemoScenarioControllerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeScenarioId,
    activeScenarioStep,
    startScenario,
    nextScenarioStep,
    resetScenario,
    resetToInitialState,
  } = useQueuePulse();

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    DEMO_SCENARIOS[0].id
  );

  if (!isOpen) return null;

  const currentScenario = DEMO_SCENARIOS.find((s) => s.id === selectedScenarioId);
  const isRunning = activeScenarioId === selectedScenarioId;
  const currentStepData = currentScenario?.steps[activeScenarioStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-surface-1 border border-border-strong rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-subtle bg-surface-2/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-accent-live/10 border border-accent-live/30 text-accent-live">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                Guided IoT Operational Scenarios
              </h2>
              <p className="text-xs text-text-secondary">
                Deterministic hardware state-machine evaluation walkthroughs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-text-tertiary hover:text-text-primary px-2 py-1 bg-surface-3 rounded border border-border-subtle"
          >
            Close ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Scenario Selector Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {DEMO_SCENARIOS.map((sc, idx) => {
              const isSelected = selectedScenarioId === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                  }}
                  className={`p-3 rounded-md border text-left transition-all ${
                    isSelected
                      ? "bg-surface-3 border-accent-live/50 text-text-primary shadow-sm"
                      : "bg-surface-2/40 border-border-subtle text-text-secondary hover:bg-surface-2"
                  }`}
                >
                  <div className="text-[10px] font-mono text-text-tertiary">
                    Scenario 0{idx + 1}
                  </div>
                  <div className="text-xs font-semibold mt-1 leading-snug line-clamp-2">
                    {sc.title.split(".")[1] || sc.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scenario Card */}
          {currentScenario && (
            <div className="bg-surface-2/50 border border-border-subtle rounded-md p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {currentScenario.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {currentScenario.description}
                </p>
              </div>

              {/* Steps Progress Visualizer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>Progress</span>
                  <span className="font-mono tabular-nums">
                    Step {isRunning ? activeScenarioStep : 0} of{" "}
                    {currentScenario.stepsCount}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {currentScenario.steps.map((step, i) => {
                    const isDone = isRunning && activeScenarioStep > step.index;
                    const isCurrent = isRunning && activeScenarioStep === step.index;
                    return (
                      <div
                        key={step.index}
                        className={`h-1.5 rounded-full transition-all ${
                          isDone
                            ? "bg-accent-live"
                            : isCurrent
                            ? "bg-accent-info animate-pulse"
                            : "bg-surface-3"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Current Step Details */}
              {isRunning && currentStepData ? (
                <div className="bg-surface-1 border border-border-subtle rounded p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-accent-info">
                      Step {currentStepData.index}: {currentStepData.title}
                    </span>
                    <Badge variant="live" dot>
                      Active Simulation
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {currentStepData.narrative}
                  </p>
                  <div className="text-[11px] font-mono text-accent-live/90 bg-accent-live/5 p-2 rounded border border-accent-live/15">
                    → Expected: {currentStepData.expectedState}
                  </div>
                </div>
              ) : (
                <div className="bg-surface-1 border border-border-subtle rounded p-3 text-xs text-text-tertiary text-center">
                  Press <strong>Launch Scenario</strong> below to step through hardware events.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border-subtle bg-surface-2/40 flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              resetToInitialState();
              resetScenario();
            }}
            className="text-xs text-text-tertiary gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset State
          </Button>

          <div className="flex items-center gap-2">
            {!isRunning ? (
              <Button
                size="sm"
                variant="live"
                onClick={() => startScenario(selectedScenarioId)}
                className="gap-2 text-xs"
              >
                <PlayCircle className="w-4 h-4" />
                Launch Scenario
              </Button>
            ) : (
              <Button
                size="sm"
                variant="live"
                onClick={nextScenarioStep}
                className="gap-2 text-xs"
              >
                <span>{currentStepData?.actionLabel || "Next Step"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

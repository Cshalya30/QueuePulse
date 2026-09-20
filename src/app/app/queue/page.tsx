"use client";

import React, { useState } from "react";
import { useQueuePulse } from "@/lib/store";
import { CurrentTokenHero } from "@/components/queue/current-token-hero";
import { QueueLane } from "@/components/queue/queue-lane";
import { TokenDrawer } from "@/components/queue/token-drawer";
import { HardwareSimulator } from "@/components/queue/hardware-simulator";
import { Tabs } from "@/components/ui/tabs";
import { Layers, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LiveQueuePage() {
  const { tokens, categories, setSelectedTokenId, generateToken } = useQueuePulse();
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("ALL");

  const filteredTokens =
    activeCategoryFilter === "ALL"
      ? tokens
      : tokens.filter((t) => t.serviceCategoryId === activeCategoryFilter);

  const waitingTokens = filteredTokens.filter((t) => t.status === "WAITING");
  const graceTokens = filteredTokens.filter((t) => t.status === "GRACE_QUEUE");
  const completedTokens = filteredTokens.filter((t) => t.status === "COMPLETED");

  const categoryTabs = [
    { id: "ALL", label: "All Categories", count: tokens.filter((t) => t.status !== "COMPLETED").length },
    ...categories.map((c) => ({
      id: c.id,
      label: c.name,
      count: tokens.filter((t) => t.serviceCategoryId === c.id && t.status !== "COMPLETED").length,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Live Queue Orchestration</span>
            <span className="text-xs px-2 py-0.5 rounded bg-accent-info/15 text-accent-info font-mono font-semibold border border-accent-info/30">
              Active State Machine
            </span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Observational queue lanes, RFID verification status, and response timers
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Tabs
            tabs={categoryTabs}
            activeTab={activeCategoryFilter}
            onChange={setActiveCategoryFilter}
          />
        </div>
      </div>

      {/* Hardware Simulator Controls Bar */}
      <HardwareSimulator />

      {/* Current Token Hero Panel */}
      <CurrentTokenHero />

      {/* 3 Queue Lanes: Normal Waiting, Grace Queue, Completed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Normal Waiting Queue */}
        <QueueLane
          title="Normal Waiting Queue"
          count={waitingTokens.length}
          tokens={waitingTokens}
          categories={categories}
          onSelectToken={setSelectedTokenId}
          emptyMessage="No pending tokens in normal queue."
          variant="normal"
        />

        {/* Grace Queue Buffer */}
        <QueueLane
          title="Grace Queue Buffer"
          count={graceTokens.length}
          tokens={graceTokens}
          categories={categories}
          onSelectToken={setSelectedTokenId}
          emptyMessage="No missed tokens in grace buffer."
          variant="grace"
        />

        {/* Recently Completed */}
        <QueueLane
          title="Completed Today"
          count={completedTokens.length}
          tokens={completedTokens}
          categories={categories}
          onSelectToken={setSelectedTokenId}
          emptyMessage="No completed tokens recorded yet."
          variant="completed"
        />
      </div>

      {/* Token Details Drawer */}
      <TokenDrawer />
    </div>
  );
}

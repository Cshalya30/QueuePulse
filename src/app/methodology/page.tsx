"use client";

import React from "react";
import Link from "next/link";
import { LandingNav } from "@/components/layout/landing-nav";
import { StageSense } from "@/components/methodology/stage-sense";
import { StageDecide } from "@/components/methodology/stage-decide";
import { StageSynchronize } from "@/components/methodology/stage-synchronize";
import { StageUnderstand } from "@/components/methodology/stage-understand";
import { StageImprove } from "@/components/methodology/stage-improve";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Layers, Radio } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary bg-tech-grid">
      <LandingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-live/10 border border-accent-live/25 text-xs font-mono text-accent-live">
          <BookOpen className="w-3.5 h-3.5" />
          <span>QueuePulse Systems Methodology</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary max-w-3xl mx-auto leading-tight">
          From physical movement to operational intelligence.
        </h1>

        <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          QueuePulse connects hardware sensing, edge state machines, cloud telemetry, and service analytics so operations teams can understand what is happening at the desk---not just who is next.
        </p>
      </section>

      {/* 5 Stages Progressive Story */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pb-28">
        <StageSense />
        <StageDecide />
        <StageSynchronize />
        <StageUnderstand />
        <StageImprove />

        {/* Final CTA */}
        <section className="p-8 sm:p-12 rounded-xl bg-surface-1 border border-border-strong text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Experience the live operational workspace.
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto">
            Test the interactive counter matrix, live queue orchestration, and hardware telemetry simulation in real time.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/app/overview">
              <Button size="lg" variant="live" className="gap-2">
                <span>Open Operations Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

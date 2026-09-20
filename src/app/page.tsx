"use client";

import React from "react";
import Link from "next/link";
import { LandingNav } from "@/components/layout/landing-nav";
import { HeroVisual } from "@/components/landing/hero-visual";
import { SystemDiagram } from "@/components/landing/system-diagram";
import { CapabilityCards } from "@/components/landing/capability-cards";
import { Button } from "@/components/ui/button";
import {
  Radio,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
  Building,
  GraduationCap,
  Library,
  Hospital,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary bg-tech-grid">
      <LandingNav />

      {/* Hero Section (Groww & Stripe Inspired) */}
      <section className="pt-32 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-live/10 border border-accent-live/30 text-xs font-mono text-accent-live">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>ESP32 Edge Control · Cloud Telemetry · Analytics</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.1]">
              Make every service queue <span className="text-accent-live">measurable.</span>
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-xl">
              QueuePulse connects physical desk sensors, local ESP32 queue control, and cloud operational analytics into one unified, auditable platform.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/app/overview">
                <Button size="lg" variant="live" className="gap-2 text-sm">
                  <span>Explore the Live Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/methodology">
                <Button size="lg" variant="outline" className="gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-accent-info" />
                  <span>How it works</span>
                </Button>
              </Link>
            </div>

            {/* Trust Points */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border-subtle text-xs font-mono text-text-tertiary">
              <div>
                <span className="block font-bold text-text-primary text-sm">Autonomous</span>
                <span>ESP32 Edge State</span>
              </div>
              <div>
                <span className="block font-bold text-text-primary text-sm">Laser ToF</span>
                <span>VL53L0X Clearance</span>
              </div>
              <div>
                <span className="block font-bold text-text-primary text-sm">Auditable</span>
                <span>NFC RFID Verification</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual */}
          <div className="lg:col-span-6">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* Section A: The Operational Problem */}
      <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border-subtle space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent-warning">
            The Operational Challenge
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            A queue is a physical process, not just a list of numbers.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Traditional */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border-subtle space-y-4">
            <h3 className="text-base font-bold text-text-secondary uppercase tracking-wider">
              Traditional Service Centre
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-text-secondary">
              <li className="flex items-start gap-2.5">
                <span className="text-accent-critical font-bold">✕</span>
                <span>Staff manually call numbers without knowing if the customer is present.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent-critical font-bold">✕</span>
                <span>Counters sit idle waiting for people who left without cancelling.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent-critical font-bold">✕</span>
                <span>Management has no factual record of wait times or service duration.</span>
              </li>
            </ul>
          </div>

          {/* QueuePulse Solution */}
          <div className="p-6 rounded-xl bg-surface-1 border border-accent-live/40 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-accent-live uppercase tracking-wider flex items-center gap-2">
              <span>QueuePulse IoT Platform</span>
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-text-primary">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-accent-live shrink-0 mt-0.5" />
                <span>ToF laser presence confirms the previous customer departed before calling next.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-accent-live shrink-0 mt-0.5" />
                <span>RFID tap validates identity and records exact service start timestamp.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-accent-live shrink-0 mt-0.5" />
                <span>Unresponsive tokens move safely to Grace Queue without blocking counter flow.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section B: Capabilities */}
      <section id="capabilities" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border-subtle space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent-live">
            Core Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Engineered for high-throughput institutional queues.
          </h2>
        </div>

        <CapabilityCards />
      </section>

      {/* Section C: Architecture (Stripe Style) */}
      <section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border-subtle space-y-12">
        <SystemDiagram />
      </section>

      {/* Section D: Institutional Use Cases */}
      <section id="usecases" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border-subtle space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent-info">
            Deployment Verticals
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Built for universities, public centres, and helpdesks.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 bg-surface-1 border border-border-subtle rounded-lg space-y-2">
            <GraduationCap className="w-6 h-6 text-accent-live" />
            <h4 className="font-bold text-sm text-text-primary">University Admin</h4>
            <p className="text-xs text-text-secondary">
              Transcripts, tuition payments, ID renewals, and academic advising desks.
            </p>
          </div>

          <div className="p-5 bg-surface-1 border border-border-subtle rounded-lg space-y-2">
            <Hospital className="w-6 h-6 text-accent-info" />
            <h4 className="font-bold text-sm text-text-primary">Hospital Admin</h4>
            <p className="text-xs text-text-secondary">
              Non-clinical billing counters, patient registration, and pharmacy pick-up lines.
            </p>
          </div>

          <div className="p-5 bg-surface-1 border border-border-subtle rounded-lg space-y-2">
            <Building className="w-6 h-6 text-accent-warning" />
            <h4 className="font-bold text-sm text-text-primary">Civic Service Centres</h4>
            <p className="text-xs text-text-secondary">
              Municipal certificates, citizen registries, and utility subsidy desks.
            </p>
          </div>

          <div className="p-5 bg-surface-1 border border-border-subtle rounded-lg space-y-2">
            <Library className="w-6 h-6 text-emerald-400" />
            <h4 className="font-bold text-sm text-text-primary">Institutional Libraries</h4>
            <p className="text-xs text-text-secondary">
              Archive loan clearance, research desks, and smartcard access verification.
            </p>
          </div>
        </div>
      </section>

      {/* Section E: Methodology Teaser & Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-border-subtle text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
          See how QueuePulse turns a queue into an operational system.
        </h2>
        <p className="text-sm text-text-secondary max-w-xl mx-auto">
          Explore the 5-stage systems methodology or launch the live operational workspace.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/app/overview">
            <Button size="lg" variant="live" className="gap-2">
              <span>Open Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/methodology">
            <Button size="lg" variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4 text-accent-info" />
              <span>Explore Methodology</span>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

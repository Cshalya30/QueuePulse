import React from "react";
import Link from "next/link";
import { Radio, ArrowRight, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LandingNav: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-sm bg-accent-live/15 border border-accent-live/40 flex items-center justify-center text-accent-live font-bold text-base group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-text-primary tracking-tight flex items-center gap-1.5">
              QueuePulse
              <span className="text-[10px] px-1.5 py-0.2 bg-accent-live/20 text-accent-live font-mono rounded font-normal">
                ESP32 + Cloud
              </span>
            </span>
            <span className="text-[10px] text-text-tertiary">
              IoT Queue Operations Platform
            </span>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-text-secondary">
          <Link href="#problem" className="hover:text-text-primary transition-colors">
            Operational Problem
          </Link>
          <Link href="#capabilities" className="hover:text-text-primary transition-colors">
            Capabilities
          </Link>
          <Link href="#architecture" className="hover:text-text-primary transition-colors">
            Architecture
          </Link>
          <Link href="#usecases" className="hover:text-text-primary transition-colors">
            Use Cases
          </Link>
          <Link
            href="/methodology"
            className="flex items-center gap-1 text-accent-info hover:text-sky-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Methodology</span>
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link href="/app/overview">
            <Button size="sm" variant="live" className="gap-2">
              <span>Open Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

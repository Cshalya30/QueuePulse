"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Cpu,
  BarChart3,
  ListRestart,
  Settings,
  BookOpen,
  Radio,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/app/overview",
    label: "Overview",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    href: "/app/queue",
    label: "Live Queue",
    icon: Layers,
    badge: "Live",
  },
  {
    href: "/app/counters",
    label: "Counters",
    icon: Cpu,
    badge: null,
  },
  {
    href: "/app/analytics",
    label: "Analytics",
    icon: BarChart3,
    badge: null,
  },
  {
    href: "/app/events",
    label: "Events Log",
    icon: ListRestart,
    badge: null,
  },
  {
    href: "/app/settings",
    label: "Settings",
    icon: Settings,
    badge: null,
  },
];

export const AppRail: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-16 md:w-56 bg-surface-1 border-r border-border-subtle flex flex-col justify-between shrink-0 select-none">
      {/* Brand logo & title */}
      <div>
        <div className="h-14 flex items-center px-3.5 md:px-4 border-b border-border-subtle gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-accent-live/15 border border-accent-live/40 flex items-center justify-center text-accent-live font-bold text-sm shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-bold text-sm text-text-primary tracking-tight flex items-center gap-1.5">
              QueuePulse
              <span className="text-[9px] px-1 bg-accent-live/20 text-accent-live font-mono rounded">
                IoT
              </span>
            </span>
            <span className="text-[10px] text-text-tertiary">
              Operations Platform
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-1">
          <div className="hidden md:block px-2.5 py-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
            Operational Views
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-sm text-xs font-medium transition-all group relative",
                  isActive
                    ? "bg-surface-3 text-text-primary border border-border-strong shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                )}
                title={item.label}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-accent-live" : "text-text-tertiary group-hover:text-text-primary"
                  )}
                />
                <span className="hidden md:inline truncate">{item.label}</span>
                {item.badge && (
                  <span className="hidden md:inline-block ml-auto text-[9px] font-mono px-1.5 py-0.2 bg-accent-live/10 text-accent-live border border-accent-live/20 rounded">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-accent-live rounded-r" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="p-2 border-t border-border-subtle space-y-1">
        <Link
          href="/methodology"
          className="flex items-center gap-3 px-2.5 py-2 rounded-sm text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors group"
          title="Methodology"
        >
          <BookOpen className="w-4 h-4 text-accent-info shrink-0" />
          <span className="hidden md:inline truncate">Methodology</span>
          <ExternalLink className="hidden md:inline w-3 h-3 ml-auto text-text-tertiary" />
        </Link>

        <Link
          href="/"
          className="flex items-center gap-3 px-2.5 py-2 rounded-sm text-xs font-medium text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
          title="Public Landing"
        >
          <span className="text-[11px] hidden md:inline">← Public Overview</span>
        </Link>
      </div>
    </aside>
  );
};

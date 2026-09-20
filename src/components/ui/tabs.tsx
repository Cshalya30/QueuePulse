"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center p-1 bg-surface-2 border border-border-subtle rounded-sm text-xs",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-sm font-medium transition-all duration-150 flex items-center gap-1.5 select-none",
              isActive
                ? "bg-surface-3 text-text-primary shadow-sm border border-border-strong"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-3/50"
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-sm text-[10px] tabular-nums",
                  isActive
                    ? "bg-accent-live/15 text-accent-live font-semibold"
                    : "bg-surface-1 text-text-tertiary"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

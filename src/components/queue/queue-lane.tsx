"use client";

import React from "react";
import { Token, ServiceCategory } from "@/types/queuepulse";
import { getTokenStatusBadge, formatDuration, formatRelativeTime } from "@/lib/utils";
import { Clock, Radio, User, ChevronRight } from "lucide-react";

interface QueueLaneProps {
  title: string;
  count: number;
  tokens: Token[];
  categories: ServiceCategory[];
  onSelectToken: (id: string) => void;
  emptyMessage?: string;
  variant?: "normal" | "grace" | "completed";
}

export const QueueLane: React.FC<QueueLaneProps> = ({
  title,
  count,
  tokens,
  categories,
  onSelectToken,
  emptyMessage = "No tokens in this lane",
  variant = "normal",
}) => {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded-md flex flex-col h-full overflow-hidden">
      {/* Lane Header */}
      <div className="p-3.5 border-b border-border-subtle bg-surface-2/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
            {title}
          </span>
          <span
            className={`px-1.5 py-0.2 rounded-sm text-[11px] font-mono font-semibold ${
              variant === "grace"
                ? "bg-accent-warning/15 text-accent-warning"
                : variant === "completed"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-surface-3 text-text-secondary"
            }`}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Tokens List */}
      <div className="p-2.5 flex-1 overflow-y-auto max-h-[500px] space-y-2">
        {tokens.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-tertiary">
            {emptyMessage}
          </div>
        ) : (
          tokens.map((token, index) => {
            const category = categories.find((c) => c.id === token.serviceCategoryId);
            const badge = getTokenStatusBadge(token.status);

            return (
              <div
                key={token.id}
                onClick={() => onSelectToken(token.id)}
                className="p-3 rounded-md bg-surface-2/50 border border-border-subtle hover:border-border-strong hover:bg-surface-2 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-text-primary group-hover:text-accent-live transition-colors">
                      {token.tokenCode}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded border"
                      style={{
                        color: category?.color || "#b8ef79",
                        borderColor: `${category?.color || "#b8ef79"}33`,
                        backgroundColor: `${category?.color || "#b8ef79"}12`,
                      }}
                    >
                      {category?.prefix}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-tertiary font-mono pt-1 border-t border-border-subtle/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {token.status === "COMPLETED"
                        ? `svc: ${formatDuration(token.serviceSeconds)}`
                        : `wait: ${formatDuration(token.waitingSeconds)}`}
                    </span>
                  </span>

                  <span className="text-[10px]">
                    {formatRelativeTime(token.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

"use client";

import React from "react";
import { Drawer } from "@/components/ui/drawer";
import { useQueuePulse } from "@/lib/store";
import { getTokenStatusBadge, formatDuration, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RfidIndicator } from "@/components/ui/rfid-indicator";
import {
  Clock,
  Radio,
  User,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
} from "lucide-react";

export const TokenDrawer: React.FC = () => {
  const {
    selectedTokenId,
    setSelectedTokenId,
    tokens,
    categories,
    counters,
    events,
  } = useQueuePulse();

  const token = tokens.find((t) => t.id === selectedTokenId);
  if (!token) return null;

  const category = categories.find((c) => c.id === token.serviceCategoryId);
  const counter = counters.find((c) => c.id === token.counterId);
  const tokenEvents = events.filter((e) => e.tokenId === token.id);
  const badge = getTokenStatusBadge(token.status);

  return (
    <Drawer
      isOpen={Boolean(selectedTokenId)}
      onClose={() => setSelectedTokenId(null)}
      title={`Token ${token.tokenCode}`}
      subtitle={`Category: ${category?.name || "Service"}`}
      width="lg"
    >
      {/* Main Status Strip */}
      <div className="p-4 bg-surface-2 border border-border-subtle rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-semibold text-text-tertiary">
            Operational State
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
          <div>
            <span className="text-text-tertiary block text-[10px]">Total Waiting Time</span>
            <span className="text-text-primary font-bold text-sm">
              {formatDuration(token.waitingSeconds)}
            </span>
          </div>

          <div>
            <span className="text-text-tertiary block text-[10px]">Service Duration</span>
            <span className="text-text-primary font-bold text-sm">
              {formatDuration(token.serviceSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* RFID & Hardware Telemetry Details */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Hardware Association
        </h4>
        <RfidIndicator
          verified={Boolean(token.rfidVerified)}
          uid={token.rfidSessionUid}
        />
      </div>

      {/* Audit Timeline */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Lifecycle Timestamp Audit
        </h4>

        <div className="space-y-2 font-mono text-xs">
          <div className="p-2.5 rounded bg-surface-2/40 border border-border-subtle flex items-center justify-between">
            <span className="text-text-secondary">1. Created & Ticket Issued:</span>
            <span className="text-text-primary font-semibold">
              {formatTime(token.createdAt)}
            </span>
          </div>

          <div className="p-2.5 rounded bg-surface-2/40 border border-border-subtle flex items-center justify-between">
            <span className="text-text-secondary">2. Called at Counter:</span>
            <span className="text-text-primary font-semibold">
              {formatTime(token.calledAt)}
            </span>
          </div>

          <div className="p-2.5 rounded bg-surface-2/40 border border-border-subtle flex items-center justify-between">
            <span className="text-text-secondary">3. RFID Tap & Service Start:</span>
            <span className="text-text-primary font-semibold">
              {formatTime(token.serviceStartedAt)}
            </span>
          </div>

          <div className="p-2.5 rounded bg-surface-2/40 border border-border-subtle flex items-center justify-between">
            <span className="text-text-secondary">4. Service Completed:</span>
            <span className="text-text-primary font-semibold">
              {formatTime(token.serviceCompletedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* System Events for this Token */}
      {tokenEvents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Related Operational Events ({tokenEvents.length})
          </h4>
          <div className="space-y-2">
            {tokenEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded bg-surface-2 border border-border-subtle text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-semibold text-text-primary">
                  <span>{evt.title}</span>
                  <span className="font-mono text-[10px] text-text-tertiary">
                    {formatTime(evt.eventTimestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  {evt.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
};

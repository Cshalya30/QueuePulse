"use client";

import React, { useState } from "react";
import { useQueuePulse } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime, formatRelativeTime, getSeverityStyle } from "@/lib/utils";
import { EventSeverity, EventSource } from "@/types/queuepulse";
import {
  ListRestart,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Download,
  Code,
  CheckCircle2,
} from "lucide-react";

export default function EventsPage() {
  const { events } = useQueuePulse();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      searchQuery === "" ||
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.tokenId && evt.tokenId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (evt.counterId && evt.counterId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity =
      selectedSeverity === "ALL" || evt.severity === selectedSeverity;

    const matchesSource =
      selectedSource === "ALL" || evt.source === selectedSource;

    return matchesSearch && matchesSeverity && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Operational Activity & Event Log</span>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-3 text-text-secondary font-mono border border-border-subtle">
              {events.length} Audited Events
            </span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Immutable chronological audit log of physical ESP32 triggers, RFID scans, and state machine transitions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export Audit Trail
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-surface-1 border border-border-subtle rounded-md text-xs">
        {/* Search */}
        <div className="flex items-center gap-2 bg-surface-2 border border-border-strong rounded px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by token, counter, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-text-primary text-xs focus:outline-none w-full placeholder:text-text-tertiary"
          />
        </div>

        {/* Severity Filter */}
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-surface-2 border border-border-strong text-text-secondary rounded px-2.5 py-1.5 font-mono focus:outline-none text-xs"
        >
          <option value="ALL">All Severities</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        {/* Source Filter */}
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="bg-surface-2 border border-border-strong text-text-secondary rounded px-2.5 py-1.5 font-mono focus:outline-none text-xs"
        >
          <option value="ALL">All Sources</option>
          <option value="ESP32_EDGE">ESP32 Edge</option>
          <option value="CLOUD_SYNC">Cloud Sync</option>
          <option value="HARDWARE_SIMULATOR">Simulator</option>
        </select>
      </div>

      {/* Events Table */}
      <Card className="bg-surface-1 border-border-subtle shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary uppercase text-[10px] font-mono bg-surface-2/40">
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 font-mono">
              {filteredEvents.map((evt) => {
                const isExpanded = expandedEventId === evt.id;
                const style = getSeverityStyle(evt.severity);

                return (
                  <React.Fragment key={evt.id}>
                    <tr
                      onClick={() =>
                        setExpandedEventId(isExpanded ? null : evt.id)
                      }
                      className="hover:bg-surface-2/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-text-tertiary">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-accent-live" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-primary whitespace-nowrap">
                        <div>{formatTime(evt.eventTimestamp)}</div>
                        <div className="text-[10px] text-text-tertiary font-sans">
                          {formatRelativeTime(evt.eventTimestamp)}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-text-primary whitespace-nowrap">
                        {evt.title}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-1.5 py-0.2 rounded bg-surface-3 text-text-secondary border border-border-subtle text-[10px]">
                          {evt.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.2 rounded border text-[10px] uppercase font-semibold ${style.badgeBg} ${style.textColor} ${style.borderColor}`}
                        >
                          {evt.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary font-sans text-xs max-w-md truncate">
                        {evt.description}
                      </td>
                    </tr>

                    {/* Expandable JSON Metadata Inspector */}
                    {isExpanded && (
                      <tr className="bg-surface-2/80">
                        <td colSpan={6} className="p-4 border-b border-border-subtle">
                          <div className="space-y-2 font-mono text-xs">
                            <div className="flex items-center gap-2 text-text-secondary text-[11px]">
                              <Code className="w-3.5 h-3.5 text-accent-live" />
                              <span>Event JSON Metadata Payload</span>
                            </div>
                            <pre className="p-3 bg-surface-3 border border-border-strong rounded text-[11px] text-text-primary overflow-x-auto">
                              {JSON.stringify(
                                {
                                  id: evt.id,
                                  eventType: evt.eventType,
                                  eventTimestamp: evt.eventTimestamp,
                                  source: evt.source,
                                  severity: evt.severity,
                                  counterId: evt.counterId,
                                  tokenId: evt.tokenId,
                                  metadata: evt.metadata,
                                },
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

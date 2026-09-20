"use client";

import React, { useState } from "react";
import { WaitTimeChart } from "@/components/analytics/wait-time-chart";
import { DurationDistribution } from "@/components/analytics/duration-distribution";
import { SlaComplianceGauge } from "@/components/analytics/sla-compliance-gauge";
import { QueuePressureChart } from "@/components/overview/queue-pressure-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Calendar, Filter } from "lucide-react";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>("Today · Sep 20");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Service Performance Analytics</span>
            <span className="text-xs px-2 py-0.5 rounded bg-accent-live/15 text-accent-live font-mono font-semibold border border-accent-live/30">
              Auditable Telemetry
            </span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Statistical operational reports derived from physical ESP32 timestamped transitions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border-subtle rounded text-xs font-mono text-text-secondary">
            <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
            <span>{dateRange}</span>
          </div>

          <Button size="sm" variant="secondary" className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Grid of Analytics Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaitTimeChart />
        <DurationDistribution />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <QueuePressureChart />
        </div>
        <div className="lg:col-span-5">
          <SlaComplianceGauge />
        </div>
      </div>

      {/* Operational Analytical Data Table */}
      <Card className="bg-surface-1 border-border-subtle shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Hourly Service Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary uppercase text-[10px]">
                <th className="py-2.5 px-3">Hour Slot</th>
                <th className="py-2.5 px-3">Tokens Issued</th>
                <th className="py-2.5 px-3">Tokens Served</th>
                <th className="py-2.5 px-3">Avg Wait Time</th>
                <th className="py-2.5 px-3">Avg Service Time</th>
                <th className="py-2.5 px-3">Missed %</th>
                <th className="py-2.5 px-3">SLA %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 text-text-secondary">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-text-primary">09:00 - 10:00</td>
                <td className="py-2.5 px-3">22</td>
                <td className="py-2.5 px-3">20</td>
                <td className="py-2.5 px-3">8m 12s</td>
                <td className="py-2.5 px-3">7m 30s</td>
                <td className="py-2.5 px-3 text-emerald-400">0.0%</td>
                <td className="py-2.5 px-3 text-accent-live">95.0%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-text-primary">10:00 - 11:00</td>
                <td className="py-2.5 px-3">34</td>
                <td className="py-2.5 px-3">28</td>
                <td className="py-2.5 px-3">14m 40s</td>
                <td className="py-2.5 px-3">8m 10s</td>
                <td className="py-2.5 px-3 text-accent-warning">3.5%</td>
                <td className="py-2.5 px-3 text-accent-live">89.2%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-text-primary">11:00 - 12:00</td>
                <td className="py-2.5 px-3">38</td>
                <td className="py-2.5 px-3">30</td>
                <td className="py-2.5 px-3 text-accent-warning">18m 20s</td>
                <td className="py-2.5 px-3">8m 45s</td>
                <td className="py-2.5 px-3 text-accent-warning">5.2%</td>
                <td className="py-2.5 px-3 text-amber-400">82.0%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-text-primary">14:00 - 15:00</td>
                <td className="py-2.5 px-3">32</td>
                <td className="py-2.5 px-3">29</td>
                <td className="py-2.5 px-3">12m 10s</td>
                <td className="py-2.5 px-3">7m 15s</td>
                <td className="py-2.5 px-3 text-emerald-400">3.1%</td>
                <td className="py-2.5 px-3 text-accent-live">93.1%</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

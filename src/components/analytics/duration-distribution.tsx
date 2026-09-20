"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

const SERVICE_DURATION_DISTRIBUTION = [
  { durationMin: "2m", tokens: 12 },
  { durationMin: "4m", tokens: 28 },
  { durationMin: "6m", tokens: 45 },
  { durationMin: "8m", tokens: 62 },
  { durationMin: "10m", tokens: 54 },
  { durationMin: "12m", tokens: 36 },
  { durationMin: "14m", tokens: 20 },
  { durationMin: "16m", tokens: 10 },
  { durationMin: "18m+", tokens: 4 },
];

export const DurationDistribution: React.FC = () => {
  return (
    <Card className="bg-surface-1 border-border-subtle shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-info" />
            <span>Service Duration Distribution</span>
          </span>
          <span className="text-[11px] text-text-tertiary font-mono">
            Metric: (service_completed_at - service_started_at)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={SERVICE_DURATION_DISTRIBUTION}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7cc8ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7cc8ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="durationMin"
                stroke="#6f767d"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              />
              <YAxis
                stroke="#6f767d"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#17191c",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#f2f3f0",
                }}
                formatter={(val: any) => [`${val} Tokens`, "Frequency"]}
              />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="#7cc8ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#distGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border-subtle font-mono">
          <span>Median service time: 7m 45s</span>
          <span>Standard Deviation: ±3m 10s</span>
        </div>
      </CardContent>
    </Card>
  );
};

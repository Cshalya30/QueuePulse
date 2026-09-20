"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, TrendingUp } from "lucide-react";

const HOURLY_QUEUE_DATA = [
  { time: "08:00", waiting: 4, arrivalRate: 8, capacity: 18 },
  { time: "09:00", waiting: 12, arrivalRate: 22, capacity: 18 },
  { time: "10:00", waiting: 26, arrivalRate: 34, capacity: 20 },
  { time: "11:00", waiting: 31, arrivalRate: 38, capacity: 20 }, // Peak morning
  { time: "12:00", waiting: 22, arrivalRate: 18, capacity: 20 },
  { time: "13:00", waiting: 18, arrivalRate: 15, capacity: 20 },
  { time: "14:00", waiting: 28, arrivalRate: 32, capacity: 20 }, // Afternoon rush
  { time: "15:00", waiting: 24, arrivalRate: 26, capacity: 20 },
  { time: "16:00", waiting: 15, arrivalRate: 14, capacity: 18 },
  { time: "17:00", waiting: 7, arrivalRate: 6, capacity: 18 },
];

export const QueuePressureChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>("today");

  return (
    <Card className="bg-surface-1 border-border-subtle shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-live" />
              <span>Queue Pressure & Congestion Timeline</span>
            </CardTitle>
            <p className="text-xs text-text-tertiary mt-0.5">
              Hourly waiting token volume vs counter service capacity
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-accent-warning bg-accent-warning/10 border border-accent-warning/25 px-2 py-0.5 rounded-sm">
              Peak: 11:00 AM (31 Waiting)
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={HOURLY_QUEUE_DATA}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="queueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b8ef79" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#b8ef79" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="arrivalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7cc8ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7cc8ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="time"
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
                domain={[0, 45]}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#17191c",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  color: "#f2f3f0",
                }}
                itemStyle={{ padding: "2px 0" }}
                formatter={(value: any, name: any) => {
                  if (name === "waiting") return [`${value} Tokens`, "Waiting Queue"];
                  if (name === "arrivalRate") return [`${value}/hr`, "Arrival Rate"];
                  return [value, name];
                }}
              />

              <ReferenceLine
                y={20}
                stroke="#e8b35c"
                strokeDasharray="4 4"
                label={{
                  value: "Nominal Staff Capacity (20)",
                  fill: "#e8b35c",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />

              <Area
                type="monotone"
                dataKey="waiting"
                stroke="#b8ef79"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#queueGrad)"
              />
              <Area
                type="monotone"
                dataKey="arrivalRate"
                stroke="#7cc8ff"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fillOpacity={1}
                fill="url(#arrivalGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border-subtle font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-live" />
              <span>Waiting Tokens</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-info" />
              <span>Arrival Velocity</span>
            </span>
          </div>
          <span>Measured via physical ToF entry & token kiosk</span>
        </div>
      </CardContent>
    </Card>
  );
};

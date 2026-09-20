"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

const CATEGORY_WAIT_DATA = [
  { category: "Documents & Certs", avgWaitMin: 11.5, slaTargetMin: 12, color: "#b8ef79" },
  { category: "Accounts & Fees", avgWaitMin: 14.8, slaTargetMin: 15, color: "#7cc8ff" },
  { category: "General Enquiries", avgWaitMin: 6.2, slaTargetMin: 8, color: "#e8b35c" },
  { category: "ID & Smartcards", avgWaitMin: 8.9, slaTargetMin: 10, color: "#d08770" },
];

export const WaitTimeChart: React.FC = () => {
  return (
    <Card className="bg-surface-1 border-border-subtle shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-live" />
            <span>Average Waiting Time by Category (Minutes)</span>
          </span>
          <span className="text-[11px] text-text-tertiary font-mono">
            Metric: (service_started_at - created_at)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={CATEGORY_WAIT_DATA}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis
                type="number"
                stroke="#6f767d"
                fontSize={11}
                unit="m"
                domain={[0, 20]}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#a3a8ad"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#17191c",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#f2f3f0",
                }}
                formatter={(val: any) => [`${val} min`, "Avg Waiting Time"]}
              />
              <Bar dataKey="avgWaitMin" radius={[0, 4, 4, 0]}>
                {CATEGORY_WAIT_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border-subtle font-mono">
          <span>All categories currently within target SLA bounds</span>
          <span>Sample: 142 tokens today</span>
        </div>
      </CardContent>
    </Card>
  );
};

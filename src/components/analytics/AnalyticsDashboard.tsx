"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard } from "@/components/analytics/MetricCard";
import { useAnalytics } from "@/hooks/useAnalytics";

export function AnalyticsDashboard() {
  const { analytics, loading } = useAnalytics();

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  const { totalProspects, replyRate, positiveReplyRate, conversionRate, funnelRows, dailyDms } = analytics;

  return (
    <div className="px-4 pb-8 pt-2 space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Total prospects" value={totalProspects} />
        <MetricCard label="Reply rate" value={`${replyRate}%`} sublabel="DMs that got a reply" />
        <MetricCard label="Positive reply rate" value={`${positiveReplyRate}%`} sublabel="Of replies that were positive" />
        <MetricCard label="Conversion rate" value={`${conversionRate}%`} sublabel="Prospects closed as Won" />
      </div>

      {/* Stage distribution */}
      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Stage distribution
        </h2>
        <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnelRows} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#71717a" }} />
              <YAxis
                type="category"
                dataKey="label"
                width={130}
                tick={{ fontSize: 10, fill: "#71717a" }}
              />
              <Tooltip
                formatter={(value) => [value, "Prospects"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {funnelRows.map((row) => (
                  <Cell key={row.stage} fill={row.accent} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Daily DMs trend */}
      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-neutral-500">
          DMs sent — last 30 days
        </h2>
        <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={dailyDms} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#71717a" }}
                tickFormatter={(v: string) => v.slice(5)}
                interval={6}
              />
              <YAxis tick={{ fontSize: 11, fill: "#71717a" }} allowDecimals={false} width={24} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
                formatter={(v) => [v, "DMs"]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

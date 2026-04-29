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

const CHART = {
  grid:    "#f4f4f5",
  tick:    "#71717a",
  border:  "1px solid #e4e4e7",
  primary: "#6366f1",
  radius:  12,
  tickSm:  9,
  tickMd:  11,
} as const;

export function AnalyticsDashboard() {
  const { analytics, loading } = useAnalytics();

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  const { totalProspects, replyRate, positiveReplyRate, conversionRate, funnelRows, dailyDms } =
    analytics;

  const allEmpty = totalProspects === 0;

  if (allEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
          <span className="text-2xl">📊</span>
        </div>
        <div>
          <p className="font-heading font-semibold text-neutral-900">No data yet</p>
          <p className="mt-1 max-w-xs text-sm text-neutral-500">
            Add prospects and start sending DMs — your stats will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-8 pt-2">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Total prospects" value={totalProspects} />
        <MetricCard label="Reply rate" value={`${replyRate}%`} sublabel="DMs that got a reply" />
        <MetricCard
          label="Positive replies"
          value={`${positiveReplyRate}%`}
          sublabel="Of replies that were interested"
        />
        <MetricCard
          label="Conversion"
          value={`${conversionRate}%`}
          sublabel="Prospects closed as Won"
        />
      </div>

      {/* Stage distribution */}
      <section>
        <h2 className="mb-3 font-heading text-xs font-medium uppercase tracking-wider text-neutral-500">
          Stage distribution
        </h2>
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={funnelRows}
              layout="vertical"
              margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                allowDecimals={false}
                tick={{ fontSize: CHART.tickMd, fill: CHART.tick }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
                tick={{ fontSize: 10, fill: CHART.tick }}
              />
              <Tooltip
                formatter={(value) => [value, "Prospects"]}
                contentStyle={{ fontSize: 12, borderRadius: CHART.radius, border: CHART.border }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20}>
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
        <h2 className="mb-3 font-heading text-xs font-medium uppercase tracking-wider text-neutral-500">
          DMs sent — last 30 days
        </h2>
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyDms} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: CHART.tickSm, fill: CHART.tick }}
                tickFormatter={(v: string) => v.slice(5)}
                interval={6}
              />
              <YAxis
                tick={{ fontSize: CHART.tickMd, fill: CHART.tick }}
                allowDecimals={false}
                width={24}
                domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: CHART.radius, border: CHART.border }}
                formatter={(v) => [v, "DMs"]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={CHART.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: CHART.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import type { KPIs, MonthlyRow, RetentionData } from "@/lib/supabase";
import { KPICard, SectionHeader, EmptyState } from "@/components/ui";

interface Props {
  retention: RetentionData | null;
  kpis: KPIs | null;
  monthly: MonthlyRow[];
}

function fmtMonthShort(m: string): string {
  if (!m) return "";
  const [y, mo] = m.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo) - 1]} '${y.slice(2)}`;
}

function fmtAxis(v: number): string {
  if (v >= 1000) return `$${Math.round(v / 1000)}K`;
  return `$${v}`;
}

export default function RetentionTab({ retention, kpis, monthly }: Props) {
  if (!retention || !kpis)
    return <EmptyState message="No retention data available yet." />;

  const recurGrowth = monthly.map((r) => ({
    month: fmtMonthShort(r.month),
    recur_revenue: r.recur_revenue,
  }));

  // Estimated retention trend per month
  const retentionTrend = monthly.map((r) => {
    const total = r.recur_customers + (r.recur_customers > 0 ? 1 : 0);
    const pct =
      total > 0
        ? Math.round((r.recur_customers / Math.max(total, 1)) * 1000) / 10
        : 0;
    return { month: fmtMonthShort(r.month), retention: pct };
  });

  return (
    <>
      {/* Recurring Client Health */}
      <SectionHeader icon="🔄">Recurring Client Health</SectionHeader>
      <div className="flex flex-wrap gap-3 mt-4">
        <KPICard
          label="Active Recurring"
          value={retention.active_recurring}
          color="#2ECC71"
          subtitle="clients on schedule"
        />
        <KPICard
          label="MRR"
          value={kpis.mrr}
          color="#2ECC71"
          subtitle="frequency-adjusted"
        />
        <KPICard
          label="Lifetime Retention %"
          value={retention.retention_pct}
          color="#F39C12"
          subtitle={`${retention.active_recurring} of ${retention.total_ever_recurring} ever acquired`}
        />
        <KPICard
          label="Churned All Time"
          value={retention.churned}
          color="#E74C3C"
        />
        <KPICard
          label="Revenue Lost to Churn"
          value="—"
          color="#E74C3C"
          subtitle="activates with cancellation data"
        />
      </div>

      {/* Frequency Breakdown — placeholder */}
      <SectionHeader icon="📊">Frequency Breakdown</SectionHeader>
      <div className="bg-brand-card rounded-lg p-5 mt-4">
        <p className="text-sm text-gray-500">
          Frequency-level breakdown (Weekly, EOW, Monthly, Quarterly) will
          populate once bookings data is enriched with per-frequency active
          counts. Wire from raw bookings grouped by frequency + status.
        </p>
      </div>

      {/* Recurring Revenue Growth */}
      <SectionHeader icon="📈">Recurring Revenue Growth</SectionHeader>
      <div className="bg-brand-card rounded-lg p-5 mt-4">
        {recurGrowth.length === 0 ? (
          <EmptyState message="No recurring revenue data yet." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={recurGrowth}>
              <CartesianGrid stroke="#222" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#FFF", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtAxis}
                tick={{ fill: "#999", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #333",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [`$${Math.round(Number(v)).toLocaleString()}`, "Recurring Rev"]}
              />
              <Area
                type="monotone"
                dataKey="recur_revenue"
                stroke="#2ECC71"
                fill="#2ECC71"
                fillOpacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Retention Trend (estimated) */}
      <SectionHeader icon="📉">Monthly Retention Trend (Estimated)</SectionHeader>
      <div className="bg-brand-card rounded-lg p-5 mt-4">
        <p className="text-[10px] text-gray-500 mb-3">
          * Estimated from monthly recurring customer count. Exact churn-per-month
          data will improve accuracy after cancellations are enriched.
        </p>
        {retentionTrend.length === 0 ? (
          <EmptyState message="No trend data yet." />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={retentionTrend}>
              <CartesianGrid stroke="#222" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#FFF", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#999", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <ReferenceLine
                y={80}
                stroke="#2ECC71"
                strokeDasharray="6 4"
                label={{ value: "80% target", fill: "#2ECC71", fontSize: 10, position: "right" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #333",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [`${Number(v).toFixed(1)}%`, "Retention"]}
              />
              <Line
                type="monotone"
                dataKey="retention"
                stroke="#EDC02C"
                strokeWidth={2}
                dot={{ fill: "#EDC02C", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}

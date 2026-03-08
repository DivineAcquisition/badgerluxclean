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
import { KPICard, SectionHeader, EmptyState, Card } from "@/components/ui";

interface Props {
  retention: RetentionData | null;
  kpis: KPIs | null;
  monthly: MonthlyRow[];
}

function fmtShort(m: string): string {
  if (!m) return "";
  const [y, mo] = m.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo) - 1]} '${y.slice(2)}`;
}

function fmtAxis(v: number): string {
  if (v >= 1000) return `$${Math.round(v / 1000)}K`;
  return `$${v}`;
}

const TT = {
  backgroundColor: "#111",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
};

export default function RetentionTab({ retention, kpis, monthly }: Props) {
  if (!retention || !kpis) return <EmptyState message="No retention data available yet." />;

  const recurGrowth = monthly.map((r) => ({ month: fmtShort(r.month), recur_revenue: r.recur_revenue }));
  const retentionTrend = monthly.map((r) => {
    const total = r.recur_customers + (r.recur_customers > 0 ? 1 : 0);
    const pct = total > 0 ? Math.round((r.recur_customers / Math.max(total, 1)) * 1000) / 10 : 0;
    return { month: fmtShort(r.month), retention: pct };
  });

  return (
    <>
      <SectionHeader icon="◈">Recurring Client Health</SectionHeader>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPICard label="Active Recurring" value={retention.active_recurring} color="green" subtitle="clients on schedule" />
        <KPICard label="MRR" value={kpis.mrr} color="green" subtitle="frequency-adjusted" />
        <KPICard label="Lifetime Retention %" value={retention.retention_pct} color="amber" subtitle={`${retention.active_recurring} of ${retention.total_ever_recurring} ever acquired`} />
        <KPICard label="Churned All Time" value={retention.churned} color="red" />
        <KPICard label="Revenue Lost to Churn" value="—" color="red" subtitle="activates with cancellation data" />
      </div>

      <SectionHeader icon="◎">Frequency Breakdown</SectionHeader>
      <Card className="mb-6">
        <p className="text-sm text-neutral-500">
          Frequency-level breakdown (Weekly, EOW, Monthly, Quarterly) will populate once bookings data is enriched with per-frequency active counts.
        </p>
      </Card>

      <SectionHeader icon="◆">Recurring Revenue Growth</SectionHeader>
      <Card className="mb-6">
        {recurGrowth.length === 0 ? <EmptyState message="No data yet." /> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={recurGrowth}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtAxis} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} formatter={(v) => [`$${Math.round(Number(v)).toLocaleString()}`, "Recurring Rev"]} />
              <Area type="monotone" dataKey="recur_revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <SectionHeader icon="◉">Monthly Retention Trend (Estimated)</SectionHeader>
      <Card>
        <p className="text-xs text-neutral-600 mb-3">* Estimated from monthly recurring customer count.</p>
        {retentionTrend.length === 0 ? <EmptyState message="No data yet." /> : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={retentionTrend}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={80} stroke="#10b981" strokeDasharray="6 4" label={{ value: "80% target", fill: "#10b981", fontSize: 10, position: "right" }} />
              <Tooltip contentStyle={TT} formatter={(v) => [`${Number(v).toFixed(1)}%`, "Retention"]} />
              <Line type="monotone" dataKey="retention" stroke="#EDC02C" strokeWidth={2} dot={{ fill: "#EDC02C", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </>
  );
}

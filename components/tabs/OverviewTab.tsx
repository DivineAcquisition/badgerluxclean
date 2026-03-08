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
} from "recharts";
import type { KPIs, MonthlyRow, RetentionData } from "@/lib/supabase";
import {
  KPICard,
  SectionHeader,
  DataTable,
  EmptyState,
  Card,
  HealthBar,
} from "@/components/ui";

interface Props {
  kpis: KPIs | null;
  monthly: MonthlyRow[];
  retention: RetentionData | null;
  filteredKPIs: Record<string, number> | null;
  selectedMonth: string;
}

function fmtShort(m: string): string {
  if (!m) return "";
  const [y, mo] = m.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo) - 1]} '${y.slice(2)}`;
}

function fmtLong(m: string): string {
  if (!m) return "";
  const [y, mo] = m.split("-");
  const names = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${names[parseInt(mo) - 1]} ${y}`;
}

function fmtAxis(v: number): string {
  if (v >= 1000) return `$${Math.round(v / 1000)}K`;
  return `$${v}`;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#171717",
  border: "1px solid #333",
  borderRadius: 8,
  fontSize: 12,
};

export default function OverviewTab({
  kpis,
  monthly,
  retention,
  filteredKPIs,
  selectedMonth,
}: Props) {
  if (!kpis) return <EmptyState message="No KPI data available yet." />;

  const chartData = monthly.slice(-14).map((r) => ({
    month: fmtShort(r.month),
    ot_revenue: r.ot_revenue,
    recur_revenue: r.recur_revenue,
    total: r.revenue,
  }));

  const tableRows = [...monthly]
    .reverse()
    .slice(0, 12)
    .map((r) => [
      fmtLong(r.month),
      r.bookings,
      r.revenue,
      r.cost,
      r.margin,
      r.revenue > 0 ? Math.round((r.margin / r.revenue) * 1000) / 10 : 0,
      r.ot_jobs,
      r.recur_jobs,
      r.recur_revenue,
    ]);

  return (
    <>
      {/* Business KPIs */}
      <SectionHeader icon="◆">Business Overview</SectionHeader>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KPICard label="Total Revenue" value={kpis.total_revenue} color="brand" />
        <KPICard label="Gross Margin" value={kpis.gross_margin} />
        <KPICard label="Margin %" value={kpis.margin_pct} />
        <KPICard label="Total Bookings" value={kpis.total_bookings} />
        <KPICard label="Avg Job Value" value={kpis.avg_job} />
        <KPICard label="Customer LTV" value={kpis.customer_ltv} color="brand" />
      </div>

      {/* Recurring Health + Distribution */}
      <SectionHeader icon="◈">Recurring Health</SectionHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <KPICard label="Active Recurring" value={kpis.active_recurring} color="green" />
          <KPICard label="MRR" value={kpis.mrr} color="green" subtitle="freq-adjusted" />
          <KPICard
            label="Retention %"
            value={retention?.retention_pct ?? 0}
            color="amber"
            subtitle={retention ? `${retention.active_recurring} of ${retention.total_ever_recurring}` : undefined}
          />
          <KPICard label="Churned" value={retention?.churned ?? 0} color="red" />
        </div>
        <HealthBar
          title="Client Health Distribution"
          segments={[
            { label: "Active", value: kpis.active_recurring, color: "bg-emerald-500" },
            { label: "One-Time", value: kpis.total_bookings - kpis.active_recurring, color: "bg-brand" },
            { label: "Churned", value: retention?.churned ?? 0, color: "bg-red-500" },
            { label: "Customers", value: kpis.total_customers, color: "bg-brand/50" },
          ]}
        />
      </div>

      {/* Revenue Trend */}
      <SectionHeader icon="◎">Revenue Trend</SectionHeader>
      <Card className="mb-6">
        {chartData.length === 0 ? (
          <EmptyState message="No monthly data yet." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#a3a3a3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtAxis} tick={{ fill: "#737373", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#EDC02C" }}
                formatter={(v, name) => [
                  `$${Math.round(Number(v)).toLocaleString()}`,
                  name === "recur_revenue" ? "Recurring" : name === "ot_revenue" ? "One-Time" : "Total",
                ]}
              />
              <Area type="monotone" dataKey="recur_revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Area type="monotone" dataKey="ot_revenue" stackId="1" stroke="#EDC02C" fill="#EDC02C" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Selected Month */}
      {selectedMonth !== "All Time" && filteredKPIs ? (
        <>
          <SectionHeader icon="◉">Selected Month — {selectedMonth}</SectionHeader>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <KPICard label="Month Revenue" value={filteredKPIs.total_revenue ?? 0} color="brand" />
            <KPICard label="Recurring Rev" value={filteredKPIs.recur_revenue ?? 0} color="green" />
            <KPICard label="One-Time Rev" value={(filteredKPIs.total_revenue ?? 0) - (filteredKPIs.recur_revenue ?? 0)} />
            <KPICard
              label="Recur % of Rev"
              value={filteredKPIs.total_revenue > 0 ? Math.round(((filteredKPIs.recur_revenue ?? 0) / filteredKPIs.total_revenue) * 1000) / 10 : 0}
            />
            <KPICard label="Gap to $100K" value={100000 - (filteredKPIs.total_revenue ?? 0)} color="amber" />
            <KPICard label="Jobs" value={filteredKPIs.total_bookings ?? 0} />
          </div>
        </>
      ) : (
        selectedMonth === "All Time" && (
          <p className="text-center text-sm text-neutral-600 my-6">
            Select a month above to see monthly breakdown
          </p>
        )
      )}

      {/* Monthly Table */}
      <SectionHeader icon="⬡">Monthly Breakdown</SectionHeader>
      {tableRows.length === 0 ? (
        <EmptyState message="No monthly data yet." />
      ) : (
        <DataTable
          headers={["Month", "Jobs", "Revenue", "Cost", "Margin", "M%", "OT", "Recur", "Recur Rev"]}
          rows={tableRows}
          formats={{ 2: "currency", 3: "currency", 4: "currency", 5: "percent", 8: "currency" }}
        />
      )}
    </>
  );
}

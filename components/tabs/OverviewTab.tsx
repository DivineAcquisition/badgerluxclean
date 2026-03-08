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
import { KPICard, SectionHeader, DataTable, EmptyState } from "@/components/ui";

interface Props {
  kpis: KPIs | null;
  monthly: MonthlyRow[];
  retention: RetentionData | null;
  filteredKPIs: Record<string, number> | null;
  selectedMonth: string;
}

function fmtMonthShort(m: string): string {
  if (!m) return "";
  const [y, mo] = m.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(mo) - 1]} '${y.slice(2)}`;
}

function fmtMonthLong(m: string): string {
  if (!m) return "";
  const [y, mo] = m.split("-");
  const names = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${names[parseInt(mo) - 1]} ${y}`;
}

function fmtAxis(v: number): string {
  if (v >= 1000) return `$${Math.round(v / 1000)}K`;
  return `$${v}`;
}

export default function OverviewTab({
  kpis,
  monthly,
  retention,
  filteredKPIs,
  selectedMonth,
}: Props) {
  if (!kpis) return <EmptyState message="No KPI data available yet." />;

  const chartData = monthly.slice(-14).map((r) => ({
    month: fmtMonthShort(r.month),
    ot_revenue: r.ot_revenue,
    recur_revenue: r.recur_revenue,
    total: r.revenue,
  }));

  const tableRows = [...monthly]
    .reverse()
    .slice(0, 12)
    .map((r) => [
      fmtMonthLong(r.month),
      r.bookings,
      r.revenue,
      r.cost,
      r.margin,
      r.revenue > 0
        ? Math.round((r.margin / r.revenue) * 1000) / 10
        : 0,
      r.ot_jobs,
      r.recur_jobs,
      r.recur_revenue,
    ]);

  return (
    <>
      {/* Business Overview */}
      <SectionHeader icon="🏠">Business Overview</SectionHeader>
      <div className="flex flex-wrap gap-3 mt-4">
        <KPICard label="Total Revenue" value={kpis.total_revenue} />
        <KPICard label="Gross Margin" value={kpis.gross_margin} />
        <KPICard label="Margin %" value={kpis.margin_pct} />
        <KPICard label="Total Bookings" value={kpis.total_bookings} />
        <KPICard label="Avg Job Value" value={kpis.avg_job} />
        <KPICard label="Customer LTV" value={kpis.customer_ltv} />
      </div>

      {/* Recurring Health */}
      <SectionHeader icon="🔄">Recurring Health</SectionHeader>
      <div className="flex flex-wrap gap-3 mt-4">
        <KPICard
          label="Active Recurring"
          value={kpis.active_recurring}
          color="#2ECC71"
        />
        <KPICard
          label="MRR"
          value={kpis.mrr}
          color="#2ECC71"
          subtitle="freq-adjusted"
        />
        <KPICard
          label="Retention %"
          value={retention?.retention_pct ?? 0}
          color="#F39C12"
          subtitle={
            retention
              ? `${retention.active_recurring} of ${retention.total_ever_recurring}`
              : undefined
          }
        />
        <KPICard label="OT → Recurring Conv" value="—" />
        <KPICard
          label="Churned"
          value={retention?.churned ?? 0}
          color="#E74C3C"
        />
      </div>

      {/* Revenue Trend */}
      <SectionHeader icon="📈">Revenue Trend</SectionHeader>
      <div className="bg-brand-card rounded-lg p-5 mt-4">
        {chartData.length === 0 ? (
          <EmptyState message="No monthly data yet." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid stroke="#222" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#FFFFFF", fontSize: 10 }}
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
                labelStyle={{ color: "#EDC02C" }}
                formatter={(v, name) => [
                  `$${Math.round(Number(v)).toLocaleString()}`,
                  name === "recur_revenue" ? "Recurring Revenue" : name === "ot_revenue" ? "OT Revenue" : "Total",
                ]}
              />
              <Area
                type="monotone"
                dataKey="recur_revenue"
                stackId="1"
                stroke="#2ECC71"
                fill="#2ECC71"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="ot_revenue"
                stackId="1"
                stroke="#EDC02C"
                fill="#EDC02C"
                fillOpacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Selected Month */}
      {selectedMonth !== "All Time" && filteredKPIs ? (
        <>
          <SectionHeader icon="🎯">
            Selected Month — {selectedMonth}
          </SectionHeader>
          <div className="flex flex-wrap gap-3 mt-4">
            <KPICard
              label="Month Revenue"
              value={filteredKPIs.total_revenue ?? 0}
            />
            <KPICard
              label="Recurring Rev"
              value={filteredKPIs.recur_revenue ?? 0}
            />
            <KPICard
              label="One-Time Rev"
              value={
                (filteredKPIs.total_revenue ?? 0) -
                (filteredKPIs.recur_revenue ?? 0)
              }
            />
            <KPICard
              label="Recur % of Rev"
              value={
                filteredKPIs.total_revenue > 0
                  ? Math.round(
                      ((filteredKPIs.recur_revenue ?? 0) /
                        filteredKPIs.total_revenue) *
                        1000
                    ) / 10
                  : 0
              }
            />
            <KPICard
              label="Gap to $100K"
              value={100000 - (filteredKPIs.total_revenue ?? 0)}
            />
            <KPICard label="Jobs" value={filteredKPIs.total_bookings ?? 0} />
          </div>
        </>
      ) : (
        selectedMonth === "All Time" && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Select a month above to see monthly breakdown
          </div>
        )
      )}

      {/* Monthly Breakdown Table */}
      <SectionHeader icon="📊">Monthly Breakdown</SectionHeader>
      <div className="mt-4">
        {tableRows.length === 0 ? (
          <EmptyState message="No monthly data yet." />
        ) : (
          <DataTable
            headers={[
              "Month", "Jobs", "Revenue", "Cost", "Margin",
              "M%", "OT", "Recur", "Recur Rev",
            ]}
            rows={tableRows}
            formats={{
              2: "currency",
              3: "currency",
              4: "currency",
              5: "percent",
              8: "currency",
            }}
          />
        )}
      </div>
    </>
  );
}

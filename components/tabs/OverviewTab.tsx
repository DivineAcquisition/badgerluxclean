"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { KPIs, MonthlyRow, RetentionData } from "@/lib/supabase";
import { KPICard, SectionHeader, DataTable, EmptyState, Card, HealthBar } from "@/components/ui";

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
function fmtAxis(v: number): string { return v >= 1000 ? `$${Math.round(v / 1000)}K` : `$${v}`; }

const TT = { backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 };

export default function OverviewTab({ kpis, monthly, retention, filteredKPIs, selectedMonth }: Props) {
  if (!kpis) return <EmptyState message="No KPI data available yet." />;

  const chartData = monthly.slice(-14).map(r => ({ month: fmtShort(r.month), ot_revenue: r.ot_revenue, recur_revenue: r.recur_revenue }));

  const tableRows = [...monthly].reverse().slice(0, 12).map(r => [
    fmtLong(r.month), r.bookings, r.revenue, r.cost, r.margin,
    r.revenue > 0 ? Math.round((r.margin / r.revenue) * 1000) / 10 : 0,
    r.ot_jobs, r.recur_jobs, r.recur_revenue,
  ]);

  const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-amber-600 to-brand p-6 md:p-8 text-black">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-black/70 mb-1">{getGreeting()}</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome to your Command Center</h1>
          <p className="text-black/70 max-w-lg">
            You have <span className="text-black font-semibold">{kpis.total_bookings} total bookings</span> tracked.
            {kpis.active_recurring > 0 && <> Your recurring base is <span className="font-semibold">{kpis.active_recurring} active clients</span>.</>}
          </p>
        </div>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Revenue" value={kpis.total_revenue} color="brand" icon="◆" />
        <KPICard label="Gross Margin" value={kpis.gross_margin} color="green" icon="◈" />
        <KPICard label="Total Bookings" value={kpis.total_bookings} icon="◎" />
        <KPICard label="Customer LTV" value={kpis.customer_ltv} color="brand" icon="◉" />
      </div>

      {/* Recurring + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <KPICard label="Active Recurring" value={kpis.active_recurring} color="green" subtitle="clients on schedule" />
          <KPICard label="MRR" value={kpis.mrr} color="green" subtitle="freq-adjusted" />
          <KPICard label="Margin %" value={kpis.margin_pct} color="amber" />
          <KPICard label="Avg Job" value={kpis.avg_job} color="brand" />
        </div>
        <HealthBar
          title="Client Health Distribution"
          segments={[
            { label: "Active", value: kpis.active_recurring, color: "bg-emerald-500" },
            { label: "One-Time", value: Math.max(kpis.total_bookings - kpis.active_recurring, 0), color: "bg-brand" },
            { label: "Churned", value: retention?.churned ?? 0, color: "bg-red-500" },
            { label: "Total", value: kpis.total_customers, color: "bg-amber-500" },
          ]}
        />
      </div>

      {/* Revenue Chart */}
      <SectionHeader icon="◎">Revenue Trend</SectionHeader>
      <Card>
        {chartData.length === 0 ? <EmptyState message="No monthly data yet." /> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtAxis} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} labelStyle={{ color: "#EDC02C" }}
                formatter={(v, name) => [`$${Math.round(Number(v)).toLocaleString()}`, name === "recur_revenue" ? "Recurring" : "One-Time"]} />
              <Area type="monotone" dataKey="recur_revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Area type="monotone" dataKey="ot_revenue" stackId="1" stroke="#EDC02C" fill="#EDC02C" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Selected Month */}
      {selectedMonth !== "All Time" && filteredKPIs ? (
        <>
          <SectionHeader icon="◉">Selected Month — {selectedMonth}</SectionHeader>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard label="Month Revenue" value={filteredKPIs.total_revenue ?? 0} color="brand" />
            <KPICard label="Recurring Rev" value={filteredKPIs.recur_revenue ?? 0} color="green" />
            <KPICard label="One-Time Rev" value={(filteredKPIs.total_revenue ?? 0) - (filteredKPIs.recur_revenue ?? 0)} />
            <KPICard label="Recur % of Rev" value={filteredKPIs.total_revenue > 0 ? Math.round(((filteredKPIs.recur_revenue ?? 0) / filteredKPIs.total_revenue) * 1000) / 10 : 0} />
            <KPICard label="Gap to $100K" value={100000 - (filteredKPIs.total_revenue ?? 0)} color="amber" />
            <KPICard label="Jobs" value={filteredKPIs.total_bookings ?? 0} />
          </div>
        </>
      ) : selectedMonth === "All Time" && (
        <p className="text-center text-sm text-neutral-600 py-4">Select a month to see monthly breakdown</p>
      )}

      {/* Table */}
      <SectionHeader icon="⬡">Monthly Breakdown</SectionHeader>
      {tableRows.length === 0 ? <EmptyState message="No monthly data yet." /> : (
        <DataTable
          headers={["Month","Jobs","Revenue","Cost","Margin","M%","OT","Recur","Recur Rev"]}
          rows={tableRows}
          formats={{ 2: "currency", 3: "currency", 4: "currency", 5: "percent", 8: "currency" }}
        />
      )}
    </div>
  );
}

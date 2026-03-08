"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type { VARow } from "@/lib/supabase";
import { KPICard, SectionHeader, DataTable, EmptyState, Card } from "@/components/ui";

interface Props {
  vaData: VARow[];
  selectedMonth: string;
}

const VA_COLORS = ["#EDC02C", "#10b981", "#3b82f6", "#8b5cf6", "#f97316", "#14b8a6"];

const TOOLTIP_STYLE = {
  backgroundColor: "#171717",
  border: "1px solid #333",
  borderRadius: 8,
  fontSize: 12,
};

export default function VATab({ vaData }: Props) {
  const totals = useMemo(() => {
    const leads = vaData.reduce((s, r) => s + r.total_leads, 0);
    const booked = vaData.reduce((s, r) => s + r.booked, 0);
    const seeds = vaData.reduce((s, r) => s + r.luxe_seeds, 0);
    const recur = vaData.reduce((s, r) => s + r.recur_conversions, 0);
    const rate = leads > 0 ? Math.round((booked / leads) * 1000) / 10 : 0;
    return { leads, booked, seeds, recur, rate };
  }, [vaData]);

  const tableRows = vaData.map((v) => [
    v.va_assigned, v.total_leads, v.booked, v.close_rate, v.revenue,
    v.margin, v.luxe_seeds, v.recur_conversions, v.pending, v.lost, v.ghosted,
  ]);

  const pieData = vaData.map((v, i) => ({
    name: v.va_assigned, value: v.total_leads, color: VA_COLORS[i % VA_COLORS.length],
  }));

  const barData = vaData.map((v) => ({
    name: v.va_assigned, Booked: v.booked, Pending: v.pending, Lost: v.lost,
  }));

  return (
    <>
      <SectionHeader icon="◉">VA Team Overview</SectionHeader>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPICard label="Total Leads" value={totals.leads} />
        <KPICard label="Total Booked" value={totals.booked} color="green" />
        <KPICard label="Team Close Rate %" value={totals.rate} color="green" />
        <KPICard label="Luxe Seeds Planted" value={totals.seeds} color="brand" />
        <KPICard label="Recurring Conversions" value={totals.recur} color="green" />
      </div>

      <SectionHeader icon="⬡">VA Leaderboard</SectionHeader>
      <div className="mb-6">
        {tableRows.length === 0 ? <EmptyState message="No VA data yet." /> : (
          <DataTable
            headers={["VA Name","Leads","Booked","Close %","Revenue","Margin","Luxe Seeds","Recur Conv","Pending","Lost","Ghosted"]}
            rows={tableRows}
            formats={{ 3: "percent", 4: "currency", 5: "currency" }}
          />
        )}
      </div>

      <SectionHeader icon="◈">Lead Distribution</SectionHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h4 className="text-sm font-medium text-neutral-400 mb-3">Leads per VA</h4>
          {pieData.length === 0 ? <EmptyState message="No data" /> : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {pieData.map((v, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                    {v.name} ({v.value})
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>
        <Card>
          <h4 className="text-sm font-medium text-neutral-400 mb-3">Booked vs Pending vs Lost</h4>
          {barData.length === 0 ? <EmptyState message="No data" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#a3a3a3", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "#737373", fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#737373" }} />
                <Bar dataKey="Booked" stackId="a" fill="#10b981" />
                <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Lost" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </>
  );
}

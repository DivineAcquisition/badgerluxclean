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
import { KPICard, SectionHeader, DataTable, EmptyState } from "@/components/ui";

interface Props {
  vaData: VARow[];
  selectedMonth: string;
}

const VA_COLORS = ["#EDC02C", "#2ECC71", "#3498DB", "#9B59B6", "#E67E22", "#1ABC9C"];

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
    v.va_assigned,
    v.total_leads,
    v.booked,
    v.close_rate,
    v.revenue,
    v.margin,
    v.luxe_seeds,
    v.recur_conversions,
    v.pending,
    v.lost,
    v.ghosted,
  ]);

  const pieData = vaData.map((v, i) => ({
    name: v.va_assigned,
    value: v.total_leads,
    color: VA_COLORS[i % VA_COLORS.length],
  }));

  const barData = vaData.map((v) => ({
    name: v.va_assigned,
    Booked: v.booked,
    Pending: v.pending,
    Lost: v.lost,
  }));

  return (
    <>
      {/* VA Team Overview */}
      <SectionHeader icon="👥">VA Team Overview</SectionHeader>
      <div className="flex flex-wrap gap-3 mt-4">
        <KPICard label="Total Leads" value={totals.leads} />
        <KPICard label="Total Booked" value={totals.booked} color="#2ECC71" />
        <KPICard
          label="Team Close Rate %"
          value={totals.rate}
          color="#2ECC71"
        />
        <KPICard
          label="Total Luxe Seeds Planted"
          value={totals.seeds}
          color="#EDC02C"
        />
        <KPICard
          label="Total Recurring Conversions"
          value={totals.recur}
          color="#2ECC71"
        />
      </div>

      {/* VA Leaderboard */}
      <SectionHeader icon="🏆">VA Leaderboard</SectionHeader>
      <div className="mt-4">
        {tableRows.length === 0 ? (
          <EmptyState message="No VA data yet." />
        ) : (
          <DataTable
            headers={[
              "VA Name", "Leads", "Booked", "Close %", "Revenue",
              "Margin", "Luxe Seeds", "Recur Conv", "Pending", "Lost",
              "Ghosted",
            ]}
            rows={tableRows}
            formats={{ 3: "percent", 4: "currency", 5: "currency" }}
          />
        )}
      </div>

      {/* Lead Distribution */}
      <SectionHeader icon="📊">Lead Distribution</SectionHeader>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        {/* Donut */}
        <div className="flex-1 bg-brand-card rounded-lg p-4">
          <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-2">
            Leads per VA
          </p>
          {pieData.length === 0 ? (
            <EmptyState message="No VA data" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1A1A",
                    border: "1px solid #333",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {pieData.map((v, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] text-gray-400">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: v.color }}
                />
                {v.name} ({v.value})
              </span>
            ))}
          </div>
        </div>

        {/* Stacked Bar */}
        <div className="flex-1 bg-brand-card rounded-lg p-4">
          <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-2">
            Booked vs Pending vs Lost
          </p>
          {barData.length === 0 ? (
            <EmptyState message="No VA data" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#DDD", fontSize: 10 }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#999", fontSize: 10 }}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1A1A",
                    border: "1px solid #333",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10, color: "#999" }}
                />
                <Bar
                  dataKey="Booked"
                  stackId="a"
                  fill="#2ECC71"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Pending"
                  stackId="a"
                  fill="#F39C12"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Lost"
                  stackId="a"
                  fill="#E74C3C"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}

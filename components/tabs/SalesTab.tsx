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
} from "recharts";
import type { SourceRow, ObjectionRow, Lead } from "@/lib/supabase";
import { KPICard, SectionHeader, DataTable, EmptyState } from "@/components/ui";

interface Props {
  sources: SourceRow[];
  objections: ObjectionRow[];
  selectedMonth: string;
  filteredLeads: Lead[];
}

const PIE_COLORS: Record<string, string> = {
  "Google LSA PHONE": "#EDC02C",
  "Google LSA MESSAGE": "#3498DB",
  Website: "#2ECC71",
  Referral: "#2ECC71",
  "Facebook Cold": "#9B59B6",
  "Cold Email": "#E67E22",
  Nextdoor: "#1ABC9C",
  "Returning Customer": "#27AE60",
};
const FALLBACK_COLORS = ["#7F8C8D", "#BDC3C7", "#95A5A6", "#34495E", "#566573"];

function getColor(source: string, idx: number): string {
  return PIE_COLORS[source] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

const RESULT_COLORS: Record<string, string> = {
  Booked: "#2ECC71",
  Pending: "#F39C12",
  "Not booked": "#E74C3C",
};

export default function SalesTab({
  sources,
  objections,
}: Props) {
  const totals = useMemo(() => {
    const total = sources.reduce((s, r) => s + r.total_leads, 0);
    const booked = sources.reduce((s, r) => s + r.booked, 0);
    const pending = sources.reduce((s, r) => s + r.pending, 0);
    const lost = sources.reduce((s, r) => s + r.lost, 0);
    const rate = total > 0 ? Math.round((booked / total) * 1000) / 10 : 0;
    return { total, booked, pending, lost, rate };
  }, [sources]);

  const pieSourceData = sources.map((s, i) => ({
    name: s.source,
    value: s.total_leads,
    color: getColor(s.source, i),
  }));

  const resultData = useMemo(() => {
    const booked = sources.reduce((s, r) => s + r.booked, 0);
    const pending = sources.reduce((s, r) => s + r.pending, 0);
    const lost = sources.reduce((s, r) => s + r.lost, 0);
    return [
      { name: "Booked", value: booked, color: RESULT_COLORS.Booked },
      { name: "Pending", value: pending, color: RESULT_COLORS.Pending },
      { name: "Not booked", value: lost, color: RESULT_COLORS["Not booked"] },
    ];
  }, [sources]);

  const sourceTableRows = sources.map((s) => [
    s.source,
    s.total_leads,
    s.booked,
    s.close_rate,
    s.pending,
    s.lost,
    s.ghosted,
    s.invalid,
    s.revenue,
    s.luxe_seeds,
    s.recur_booked,
  ]);

  const filteredObjections = objections.filter(
    (o) => o.objection !== "Booked"
  );
  const objectionTableRows = filteredObjections.map((o) => [
    o.objection,
    o.count,
    o.booked_after,
    o.count > 0
      ? Math.round((o.booked_after / o.count) * 1000) / 10
      : 0,
  ]);

  const objectionChartData = filteredObjections
    .slice(0, 8)
    .map((o) => ({ name: o.objection, count: o.count }));

  return (
    <>
      {/* KPIs */}
      <SectionHeader icon="🎯">Lead Source KPIs</SectionHeader>
      <div className="flex flex-wrap gap-3 mt-4">
        <KPICard label="Total Leads Tracked" value={totals.total} />
        <KPICard label="Booked" value={totals.booked} color="#2ECC71" />
        <KPICard label="Close Rate %" value={totals.rate} color="#2ECC71" />
        <KPICard label="Pending" value={totals.pending} color="#F39C12" />
        <KPICard label="Lost" value={totals.lost} color="#E74C3C" />
      </div>

      {/* Source Distribution */}
      <SectionHeader icon="📊">Source Distribution</SectionHeader>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        {/* Leads by Source Donut */}
        <div className="flex-1 bg-brand-card rounded-lg p-4">
          <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-2">
            Leads by Source
          </p>
          {pieSourceData.length === 0 ? (
            <EmptyState message="No source data" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieSourceData.map((entry, i) => (
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
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FFFFFF"
                  fontSize={24}
                  fontWeight="bold"
                >
                  {totals.total}
                </text>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {pieSourceData.map((s, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] text-gray-400">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: s.color }}
                />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>

        {/* Result Donut */}
        <div className="flex-1 bg-brand-card rounded-lg p-4">
          <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-2">
            Final Result Breakdown
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={resultData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
              >
                {resultData.map((entry, i) => (
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
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {resultData.map((r, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] text-gray-400">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: r.color }}
                />
                {r.name} ({r.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Source Table */}
      <SectionHeader icon="📋">Source Breakdown</SectionHeader>
      <div className="mt-4">
        {sourceTableRows.length === 0 ? (
          <EmptyState message="No source data yet." />
        ) : (
          <DataTable
            headers={[
              "Source", "Leads", "Booked", "Close %", "Pending",
              "Lost", "Ghosted", "Invalid", "Revenue", "Luxe Seeds",
              "Recur Booked",
            ]}
            rows={sourceTableRows}
            formats={{ 3: "percent", 8: "currency" }}
          />
        )}
      </div>

      {/* Objections */}
      <SectionHeader icon="❌">Objection Analysis</SectionHeader>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-1">
          {objectionTableRows.length === 0 ? (
            <EmptyState message="No objection data yet." />
          ) : (
            <DataTable
              headers={["Objection", "Count", "Recovered", "Recovery Rate"]}
              rows={objectionTableRows}
              formats={{ 3: "percent" }}
            />
          )}
        </div>
        <div className="flex-1 bg-brand-card rounded-lg p-4">
          {objectionChartData.length === 0 ? (
            <EmptyState message="No objection data" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={objectionChartData} layout="vertical">
                <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tick={{ fill: "#999", fontSize: 10 }}
                  axisLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#DDD", fontSize: 10 }}
                  width={120}
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
                <Bar dataKey="count" fill="#E74C3C" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}

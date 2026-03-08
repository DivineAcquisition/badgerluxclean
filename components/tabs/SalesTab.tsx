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
import { KPICard, SectionHeader, DataTable, EmptyState, Card } from "@/components/ui";

interface Props {
  sources: SourceRow[];
  objections: ObjectionRow[];
  selectedMonth: string;
  filteredLeads: Lead[];
}

const SOURCE_COLORS: Record<string, string> = {
  "Google LSA PHONE": "#EDC02C",
  "Google LSA MESSAGE": "#3b82f6",
  Website: "#10b981",
  Referral: "#10b981",
  "Facebook Cold": "#8b5cf6",
  "Cold Email": "#f97316",
  Nextdoor: "#14b8a6",
  "Returning Customer": "#22c55e",
};
const FALLBACK = ["#6b7280", "#9ca3af", "#71717a", "#404040", "#525252"];

function getColor(source: string, idx: number): string {
  return SOURCE_COLORS[source] || FALLBACK[idx % FALLBACK.length];
}

const RESULT_COLORS: Record<string, string> = {
  Booked: "#10b981",
  Pending: "#f59e0b",
  "Not booked": "#ef4444",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#171717",
  border: "1px solid #333",
  borderRadius: 8,
  fontSize: 12,
};

export default function SalesTab({ sources, objections }: Props) {
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
    s.source, s.total_leads, s.booked, s.close_rate, s.pending,
    s.lost, s.ghosted, s.invalid, s.revenue, s.luxe_seeds, s.recur_booked,
  ]);

  const filteredObjections = objections.filter((o) => o.objection !== "Booked");
  const objTableRows = filteredObjections.map((o) => [
    o.objection, o.count, o.booked_after,
    o.count > 0 ? Math.round((o.booked_after / o.count) * 1000) / 10 : 0,
  ]);
  const objChartData = filteredObjections.slice(0, 8).map((o) => ({ name: o.objection, count: o.count }));

  return (
    <>
      <SectionHeader icon="◎">Lead Source KPIs</SectionHeader>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPICard label="Total Leads Tracked" value={totals.total} />
        <KPICard label="Booked" value={totals.booked} color="green" />
        <KPICard label="Close Rate %" value={totals.rate} color="green" />
        <KPICard label="Pending" value={totals.pending} color="amber" />
        <KPICard label="Lost" value={totals.lost} color="red" />
      </div>

      <SectionHeader icon="◈">Source Distribution</SectionHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <h4 className="text-sm font-medium text-neutral-400 mb-3">Leads by Source</h4>
          {pieSourceData.length === 0 ? <EmptyState message="No data" /> : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieSourceData} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {pieSourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={22} fontWeight="bold">{totals.total}</text>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {pieSourceData.map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>
        <Card>
          <h4 className="text-sm font-medium text-neutral-400 mb-3">Final Result</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={resultData} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value">
                {resultData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {resultData.map((r, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-neutral-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                {r.name} ({r.value})
              </span>
            ))}
          </div>
        </Card>
      </div>

      <SectionHeader icon="⬡">Source Breakdown</SectionHeader>
      <div className="mb-6">
        {sourceTableRows.length === 0 ? <EmptyState message="No source data yet." /> : (
          <DataTable
            headers={["Source","Leads","Booked","Close %","Pending","Lost","Ghosted","Invalid","Revenue","Luxe Seeds","Recur Booked"]}
            rows={sourceTableRows}
            formats={{ 3: "percent", 8: "currency" }}
          />
        )}
      </div>

      <SectionHeader icon="◉">Objection Analysis</SectionHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          {objTableRows.length === 0 ? <EmptyState message="No objection data." /> : (
            <DataTable headers={["Objection","Count","Recovered","Recovery Rate"]} rows={objTableRows} formats={{ 3: "percent" }} />
          )}
        </div>
        <Card>
          {objChartData.length === 0 ? <EmptyState message="No data" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={objChartData} layout="vertical">
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: "#737373", fontSize: 11 }} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#a3a3a3", fontSize: 11 }} width={120} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </>
  );
}

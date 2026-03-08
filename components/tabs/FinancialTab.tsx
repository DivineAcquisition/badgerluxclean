"use client";

import React, { useState, useEffect } from "react";
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  Line,
  ComposedChart,
} from "recharts";
import { supabase } from "@/lib/supabase";
import type { KPIs, MonthlyRow } from "@/lib/supabase";
import { KPICard, SectionHeader, EmptyState, Card } from "@/components/ui";

interface Props {
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

interface VerificationData {
  leadsTotal: number;
  leadsMatched: number;
  matchRate: number;
  leadsNotInBK: number;
  bkNotTracked: number;
}

export default function FinancialTab({ kpis, monthly }: Props) {
  const [chargesRevenue, setChargesRevenue] = useState<number | null>(null);
  const [declinedCount, setDeclinedCount] = useState<number | null>(null);
  const [totalTips, setTotalTips] = useState<number | null>(null);
  const [verification, setVerification] = useState<VerificationData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: paid } = await supabase.from("charges").select("charge_amount").eq("payment_status", "Paid");
        if (paid && paid.length > 0) setChargesRevenue(paid.reduce((s, r) => s + (r.charge_amount || 0), 0));

        const { count: declined } = await supabase.from("charges").select("*", { count: "exact", head: true }).eq("payment_status", "Declined");
        if (declined !== null) setDeclinedCount(declined);

        const { data: tips } = await supabase.from("charges").select("tips").eq("payment_status", "Paid");
        if (tips && tips.length > 0) setTotalTips(tips.reduce((s, r) => s + (r.tips || 0), 0));
      } catch (e) { console.error("Financial charges query error:", e); }
    })();

    (async () => {
      try {
        const { count: leadsTotal } = await supabase.from("leads").select("*", { count: "exact", head: true });
        const { data: leadEmails } = await supabase.from("leads").select("email").not("email", "is", null).neq("email", "");
        const { data: bookingEmails } = await supabase.from("bookings").select("customer_email");

        if (leadEmails && bookingEmails) {
          const bkSet = new Set(bookingEmails.map((r) => r.customer_email?.toLowerCase()));
          const leadEmailArr = leadEmails.map((r) => r.email?.toLowerCase()).filter(Boolean) as string[];
          const leadEmailSet = new Set(leadEmailArr);
          const matchedCount = leadEmailArr.filter((e) => bkSet.has(e)).length;
          const total = leadsTotal ?? leadEmails.length;
          const bkNotTracked = Array.from(bkSet).filter((e) => e && !leadEmailSet.has(e)).length;

          setVerification({
            leadsTotal: total,
            leadsMatched: matchedCount,
            matchRate: total > 0 ? Math.round((matchedCount / total) * 1000) / 10 : 0,
            leadsNotInBK: total - matchedCount,
            bkNotTracked,
          });
        }
      } catch (e) { console.error("Verification query error:", e); }
    })();
  }, []);

  if (!kpis) return <EmptyState message="No financial data available yet." />;

  const revCostData = monthly.slice(-14).map((r) => ({
    month: fmtShort(r.month),
    Revenue: r.revenue,
    Cost: r.cost,
    "Margin %": r.revenue > 0 ? Math.round((r.margin / r.revenue) * 1000) / 10 : 0,
  }));

  const revenueTypeData = monthly.map((r) => ({
    month: fmtShort(r.month),
    ot_revenue: r.ot_revenue,
    recur_revenue: r.recur_revenue,
  }));

  const bookingsRev = kpis.total_revenue;
  const variance = chargesRevenue !== null ? bookingsRev - chargesRevenue : null;
  const variancePct = chargesRevenue !== null && bookingsRev > 0
    ? Math.round(((variance ?? 0) / bookingsRev) * 1000) / 10 : null;

  return (
    <>
      <SectionHeader icon="◆">Revenue Overview</SectionHeader>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KPICard label="Total Revenue" value={kpis.total_revenue} color="brand" />
        <KPICard label="Total Cost" value={kpis.total_cost} />
        <KPICard label="Gross Margin" value={kpis.gross_margin} color="green" />
        <KPICard label="Margin %" value={kpis.margin_pct} color="green" />
        <KPICard label="Total Tips" value={totalTips !== null ? totalTips : "—"} subtitle={totalTips === null ? "activates with charge data" : undefined} />
        <KPICard label="Avg Margin Per Job" value={kpis.total_bookings > 0 ? Math.round((kpis.gross_margin / kpis.total_bookings) * 100) / 100 : 0} />
      </div>

      <SectionHeader icon="◎">Revenue Reconciliation</SectionHeader>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <KPICard label="Bookings Revenue" value={bookingsRev} color="brand" />
        <KPICard label="Charges Revenue" value={chargesRevenue !== null ? chargesRevenue : "—"} />
        <KPICard label="Revenue Variance" value={variance !== null ? variance : "—"} />
        <KPICard label="Variance %" value={variancePct !== null ? variancePct : "—"} />
        <KPICard label="Declined Charges" value={declinedCount !== null ? declinedCount : "—"} color="red" />
      </div>
      <Card className="mb-6">
        <p className="text-xs text-neutral-500 leading-relaxed">
          Revenue reconciliation compares what BookingKoala says was booked (Bookings_Raw) against what was actually charged (Charges_Raw).
          Variance highlights unbilled bookings or charge discrepancies. Charges data populates after Zapier go-live.
        </p>
      </Card>

      <SectionHeader icon="◉">Data Verification</SectionHeader>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <KPICard label="Leads in Archive" value={verification?.leadsTotal ?? "—"} />
        <KPICard label="Leads Matched to BK" value={verification?.leadsMatched ?? "—"} color="green" />
        <KPICard label="Match Rate %" value={verification?.matchRate ?? "—"} />
        <KPICard label="Leads NOT in BK" value={verification?.leadsNotInBK ?? "—"} color="amber" />
        <KPICard label="BK Not Tracked" value={verification?.bkNotTracked ?? "—"} color="red" />
      </div>
      <Card className="mb-6">
        <p className="text-xs text-neutral-500 leading-relaxed font-mono">
          BookingKoala → Zapier → Google Sheets → Sync → Supabase → Dashboard<br />
          VAs enter leads in Lead_Tracker → archived to Leads_Archive<br />
          Cross-reference: Does every lead have a booking? Does every booking have a lead?
        </p>
      </Card>

      <SectionHeader icon="⬡">Monthly Revenue vs Cost</SectionHeader>
      <Card className="mb-6">
        {revCostData.length === 0 ? <EmptyState message="No data yet." /> : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={revCostData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tickFormatter={fmtAxis} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={TT}
                formatter={(v, name) => name === "Margin %" ? [`${Number(v).toFixed(1)}%`, name] : [`$${Math.round(Number(v)).toLocaleString()}`, name]}
              />
              <Bar yAxisId="left" dataKey="Revenue" fill="#EDC02C" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="Cost" fill="#525252" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="Margin %" stroke="#10b981" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>

      <SectionHeader icon="◈">Revenue by Type Over Time</SectionHeader>
      <Card>
        {revenueTypeData.length === 0 ? <EmptyState message="No data yet." /> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueTypeData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtAxis} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT}
                formatter={(v, name) => [`$${Math.round(Number(v)).toLocaleString()}`, name === "recur_revenue" ? "Recurring" : "One-Time"]}
              />
              <Area type="monotone" dataKey="ot_revenue" stackId="1" stroke="#EDC02C" fill="#EDC02C" fillOpacity={0.3} />
              <Area type="monotone" dataKey="recur_revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </>
  );
}

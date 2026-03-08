"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  useKPIs,
  useMonthly,
  useSources,
  useVAPerformance,
  useRetention,
  useObjections,
  useLastSync,
  useFilteredKPIs,
  useFilteredLeads,
} from "@/lib/hooks";
import { LiveIndicator, MonthPicker, SyncButton } from "@/components/ui";
import Sidebar from "@/components/Sidebar";
import OverviewTab from "@/components/tabs/OverviewTab";
import SalesTab from "@/components/tabs/SalesTab";
import RetentionTab from "@/components/tabs/RetentionTab";
import VATab from "@/components/tabs/VATab";
import FinancialTab from "@/components/tabs/FinancialTab";

function parseMonthRange(
  month: string
): { start: string; end: string } | null {
  if (month === "All Time") return null;
  const parts = month.split(" ");
  if (parts.length !== 2) return null;
  const names = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const mi = names.indexOf(parts[0]);
  const year = parseInt(parts[1]);
  if (mi === -1 || isNaN(year)) return null;
  const start = `${year}-${String(mi + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, mi + 1, 0).getDate();
  const end = `${year}-${String(mi + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState("All Time");

  const range = useMemo(() => parseMonthRange(selectedMonth), [selectedMonth]);
  const startDate = range?.start ?? null;
  const endDate = range?.end ?? null;

  const { data: kpis, loading: kpisLoading } = useKPIs();
  const { data: monthly } = useMonthly();
  const { data: sources } = useSources();
  const { data: vaData } = useVAPerformance();
  const { data: retention } = useRetention();
  const { data: objections } = useObjections();
  const lastSync = useLastSync();
  const { data: filteredKPIs } = useFilteredKPIs(startDate, endDate);
  const { data: filteredLeads } = useFilteredLeads(startDate, endDate);

  const handleSync = useCallback(async () => {
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: "badgerlux-sync-2026" }),
    });
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-brand animate-pulse text-lg">Loading…</p>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-brand animate-pulse text-lg">
          Redirecting to login…
        </p>
      </div>
    );
  }

  if (kpisLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-brand text-lg font-bold tracking-tight mb-2">
            BADGERLUXCLEAN
          </h1>
          <p className="text-neutral-500 text-sm animate-pulse">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userEmail={user.email || ""}
        onSignOut={signOut}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-neutral-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {activeTab === "overview" && "Command Center"}
              {activeTab === "sales" && "Sales & Leads"}
              {activeTab === "retention" && "Retention"}
              {activeTab === "va" && "VA Performance"}
              {activeTab === "financial" && "Financial"}
            </h2>
            <p className="text-neutral-500 text-sm">Real-time operational pulse</p>
          </div>
          <div className="flex items-center gap-4">
            <LiveIndicator lastSync={lastSync} />
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
            <SyncButton onSync={handleSync} />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 animate-fadeIn" key={activeTab}>
          {activeTab === "overview" && (
            <OverviewTab
              kpis={kpis}
              monthly={monthly}
              retention={retention}
              filteredKPIs={filteredKPIs}
              selectedMonth={selectedMonth}
            />
          )}
          {activeTab === "sales" && (
            <SalesTab
              sources={sources}
              objections={objections}
              selectedMonth={selectedMonth}
              filteredLeads={filteredLeads}
            />
          )}
          {activeTab === "retention" && (
            <RetentionTab
              retention={retention}
              kpis={kpis}
              monthly={monthly}
            />
          )}
          {activeTab === "va" && (
            <VATab vaData={vaData} selectedMonth={selectedMonth} />
          )}
          {activeTab === "financial" && (
            <FinancialTab kpis={kpis} monthly={monthly} />
          )}

          {/* Footer */}
          <div className="text-center py-12 mt-8 border-t border-neutral-800">
            <p className="text-xs text-neutral-600">
              BADGERLUXCLEAN DATA COMMAND CENTER — Built by{" "}
              <span className="text-brand/60 font-medium">
                Divine Acquisition
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

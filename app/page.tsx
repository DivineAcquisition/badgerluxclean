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
import {
  LiveIndicator,
  MonthPicker,
  SyncButton,
} from "@/components/ui";
import OverviewTab from "@/components/tabs/OverviewTab";
import SalesTab from "@/components/tabs/SalesTab";
import RetentionTab from "@/components/tabs/RetentionTab";
import VATab from "@/components/tabs/VATab";
import FinancialTab from "@/components/tabs/FinancialTab";

const TABS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "sales", label: "Sales & Leads", icon: "🎯" },
  { key: "retention", label: "Retention", icon: "🔄" },
  { key: "va", label: "VA Performance", icon: "👥" },
  { key: "financial", label: "Financial", icon: "💰" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
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

  // Auth: loading
  if (authLoading) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-brand-gold animate-pulse text-lg">Loading…</p>
      </main>
    );
  }

  // Auth: not signed in — redirect handled client-side
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-brand-gold animate-pulse text-lg">
          Redirecting to login…
        </p>
      </main>
    );
  }

  // Data loading
  if (kpisLoading) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-brand-gold animate-pulse text-lg">
          Loading dashboard…
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-banner border-b-[3px] border-brand-gold px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold tracking-[4px] text-brand-gold">
              BADGERLUXCLEAN
            </h1>
            <p className="text-[10px] text-gray-600 tracking-wide">
              DATA COMMAND CENTER
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <LiveIndicator lastSync={lastSync} />
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
            <SyncButton onSync={handleSync} />
            <span className="text-gray-600 text-[10px] hidden md:inline">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-[73px] z-40 bg-[#111111] border-b border-[#222] overflow-x-auto">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-[12px] font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeTab === tab.key
                  ? "text-brand-gold border-brand-gold bg-brand-card"
                  : "text-gray-600 border-transparent hover:text-gray-400"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 pb-16">
        <div
          key={activeTab}
          className="animate-[fadeIn_200ms_ease-in-out]"
        >
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
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8">
        <p className="text-[10px] text-gray-700">
          BADGERLUXCLEAN DATA COMMAND CENTER — Built by Divine Acquisition
        </p>
      </footer>
    </div>
  );
}

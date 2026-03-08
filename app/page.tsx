"use client";

import React, { useState, useMemo, useCallback, Component, ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import {
  useKPIs, useMonthly, useSources, useVAPerformance,
  useRetention, useObjections, useLastSync,
  useFilteredKPIs, useFilteredLeads,
} from "@/lib/hooks";
import { LiveIndicator, MonthPicker, SyncButton } from "@/components/ui";
import Sidebar from "@/components/Sidebar";
import OverviewTab from "@/components/tabs/OverviewTab";
import SalesTab from "@/components/tabs/SalesTab";
import RetentionTab from "@/components/tabs/RetentionTab";
import VATab from "@/components/tabs/VATab";
import FinancialTab from "@/components/tabs/FinancialTab";

// ─── Error Boundary ─────────────────────────────────

interface EBState { hasError: boolean; error: string }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-brand text-lg font-bold mb-2">BADGERLUXCLEAN</h1>
            <p className="text-neutral-400 text-sm mb-4">Something went wrong.</p>
            <p className="text-neutral-600 text-xs font-mono mb-6">{this.state.error}</p>
            <button onClick={() => window.location.reload()} className="bg-brand text-black font-medium px-4 py-2 rounded-lg text-sm">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Helpers ────────────────────────────────────────

const TAB_TITLES: Record<string, string> = {
  overview: "Dashboard",
  sales: "Sales & Leads",
  retention: "Retention",
  va: "VA Performance",
  financial: "Financial",
};

function parseMonthRange(month: string): { start: string; end: string } | null {
  if (month === "All Time") return null;
  const parts = month.split(" ");
  if (parts.length !== 2) return null;
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mi = names.indexOf(parts[0]);
  const year = parseInt(parts[1]);
  if (mi === -1 || isNaN(year)) return null;
  const start = `${year}-${String(mi + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, mi + 1, 0).getDate();
  const end = `${year}-${String(mi + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

// ─── Dashboard ──────────────────────────────────────

function DashboardInner() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState("All Time");

  const range = useMemo(() => parseMonthRange(selectedMonth), [selectedMonth]);
  const { data: kpis, loading: kpisLoading } = useKPIs();
  const { data: monthly } = useMonthly();
  const { data: sources } = useSources();
  const { data: vaData } = useVAPerformance();
  const { data: retention } = useRetention();
  const { data: objections } = useObjections();
  const lastSync = useLastSync();
  const { data: filteredKPIs } = useFilteredKPIs(range?.start ?? null, range?.end ?? null);
  const { data: filteredLeads } = useFilteredLeads(range?.start ?? null, range?.end ?? null);

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
        <div className="w-7 h-7 rounded-lg bg-brand animate-pulse" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-brand animate-pulse text-sm">Redirecting…</p>
      </div>
    );
  }

  if (kpisLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-7 h-7 rounded-lg bg-brand mx-auto mb-3" />
          <p className="text-neutral-500 text-sm animate-pulse">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      <div className="hidden md:block shrink-0">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} userEmail={user.email || ""} onSignOut={signOut} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-4 md:px-6 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {/* Mobile logo */}
            <button onClick={() => setActiveTab("overview")} className="md:hidden flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-brand flex items-center justify-center">
                <span className="text-black text-[10px] font-bold">BL</span>
              </div>
            </button>
            <h1 className="text-sm font-semibold text-white">{TAB_TITLES[activeTab]}</h1>
          </div>

          <div className="flex items-center gap-3">
            <LiveIndicator lastSync={lastSync} />
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
            <SyncButton onSync={handleSync} />
          </div>
        </header>

        {/* Mobile nav */}
        <div className="md:hidden flex border-b border-white/10 overflow-x-auto scrollbar-thin">
          {Object.entries(TAB_TITLES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === key
                  ? "text-brand border-brand"
                  : "text-neutral-500 border-transparent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto scrollbar-thin">
          <div className="mx-auto max-w-full animate-fade-in" key={activeTab}>
            {activeTab === "overview" && (
              <OverviewTab kpis={kpis} monthly={monthly} retention={retention} filteredKPIs={filteredKPIs} selectedMonth={selectedMonth} />
            )}
            {activeTab === "sales" && (
              <SalesTab sources={sources} objections={objections} selectedMonth={selectedMonth} filteredLeads={filteredLeads} />
            )}
            {activeTab === "retention" && (
              <RetentionTab retention={retention} kpis={kpis} monthly={monthly} />
            )}
            {activeTab === "va" && (
              <VATab vaData={vaData} selectedMonth={selectedMonth} />
            )}
            {activeTab === "financial" && (
              <FinancialTab kpis={kpis} monthly={monthly} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardInner />
    </ErrorBoundary>
  );
}

"use client";

import React, { useState, useEffect, ReactNode } from "react";

// ─── Formatting ─────────────────────────────────────

function fmtCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}
function fmtPercent(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(1) + "%";
}
function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Math.round(n).toLocaleString("en-US");
}
function autoFormat(label: string, value: number): string {
  const l = label.toLowerCase();
  if (/(revenue|margin|mrr|ltv|avg|cost|lost|gap|tips|pay)/.test(l) && !l.includes("%")) return fmtCurrency(value);
  if (/(rate|retention|%|pct)/.test(l)) return fmtPercent(value);
  return fmtNumber(value);
}

// ─── KPICard (Vistrial "bento stat" style) ──────────

interface KPICardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  color?: "default" | "green" | "red" | "amber" | "brand";
  icon?: string;
}

const iconBgMap: Record<string, string> = {
  default: "bg-white/10 text-white",
  green: "bg-emerald-500/15 text-emerald-400",
  red: "bg-red-500/15 text-red-400",
  amber: "bg-amber-500/15 text-amber-400",
  brand: "bg-brand/15 text-brand",
};
const valColorMap: Record<string, string> = {
  default: "text-white",
  green: "text-emerald-400",
  red: "text-red-400",
  amber: "text-amber-400",
  brand: "text-brand",
};

export function KPICard({ label, value, subtitle, color = "default", icon }: KPICardProps) {
  const formatted = typeof value === "string" ? value : autoFormat(label, value);
  return (
    <div className="group card-elevated p-5 transition-all duration-200">
      {icon && (
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${iconBgMap[color]} transition-colors`}>
            <span className="text-base">{icon}</span>
          </div>
        </div>
      )}
      <div className={`text-2xl font-bold ${valColorMap[color]} mb-1`}>{formatted}</div>
      <p className="text-sm text-neutral-500">{label}</p>
      {subtitle && <p className="text-xs text-neutral-600 mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── SectionHeader ──────────────────────────────────

export function SectionHeader({ children, icon }: { children: ReactNode; icon?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
      <h2 className="text-base font-semibold text-white flex items-center gap-2">
        {icon && <span className="text-brand">{icon}</span>}
        {children}
      </h2>
    </div>
  );
}

// ─── DataTable ──────────────────────────────────────

interface DataTableProps {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  formats?: Record<number, "currency" | "percent" | "number">;
}

function formatCell(val: string | number | null | undefined, fmt?: "currency" | "percent" | "number"): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "string" && !fmt) return val;
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n as number)) return String(val);
  if (fmt === "currency") return fmtCurrency(n as number);
  if (fmt === "percent") return fmtPercent(n as number);
  return fmtNumber(n as number);
}

export function DataTable({ headers, rows, formats }: DataTableProps) {
  return (
    <div className="card-elevated overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-white/10">
            {headers.map((h, i) => (
              <th key={i} className={`px-4 py-3 text-xs font-medium text-neutral-500 ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className={`px-4 py-3 text-sm ${ci === 0 ? "text-left text-white font-medium" : "text-right text-neutral-400"}`}>
                  {formatCell(cell, formats?.[ci])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MonthPicker ────────────────────────────────────

function generateMonths(): string[] {
  const months: string[] = [];
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (let y = 2024; y <= 2028; y++) for (let m = 0; m < 12; m++) months.push(`${names[m]} ${y}`);
  return months;
}

export function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-9 bg-white/[0.04] text-white border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 hover:bg-white/[0.06] transition-colors">
      <option value="All Time">All Time</option>
      {generateMonths().map((m) => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

// ─── LiveIndicator ──────────────────────────────────

function timeSince(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function LiveIndicator({ lastSync }: { lastSync: string | null }) {
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30_000); return () => clearInterval(id); }, []);
  return (
    <div className="hidden sm:flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-brand font-medium text-xs">LIVE</span>
      {lastSync && <span className="text-neutral-600 text-xs">{timeSince(lastSync)}</span>}
    </div>
  );
}

// ─── SyncButton ─────────────────────────────────────

export function SyncButton({ onSync }: { onSync: () => Promise<void> }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<"ok" | "fail" | null>(null);
  async function handleSync() {
    setSyncing(true); setResult(null);
    try { await onSync(); setResult("ok"); setTimeout(() => setResult(null), 2000); }
    catch { setResult("fail"); setTimeout(() => setResult(null), 3000); }
    finally { setSyncing(false); }
  }
  return (
    <button onClick={handleSync} disabled={syncing}
      className="h-9 flex items-center gap-1.5 px-3 bg-white/[0.04] text-neutral-400 text-xs font-medium rounded-lg border border-white/10 hover:border-brand/40 hover:text-brand transition-all disabled:opacity-50">
      {syncing ? <span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        : result === "ok" ? <span className="text-emerald-400">✓</span>
        : result === "fail" ? <span className="text-red-400">✕</span>
        : <span>↻</span>}
      {syncing ? "Syncing…" : result === "ok" ? "Done!" : result === "fail" ? "Failed" : "Sync"}
    </button>
  );
}

// ─── Shared Components ──────────────────────────────

export function EmptyState({ message }: { message: string }) {
  return <div className="flex flex-col items-center justify-center py-16 text-neutral-600"><p className="text-sm">{message}</p></div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card-elevated p-5 ${className}`}>{children}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Booked: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Not booked": "bg-red-500/10 text-red-400 border-red-500/20",
    Cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    Declined: "bg-red-500/10 text-red-400 border-red-500/20",
    Ghosted: "bg-neutral-500/10 text-neutral-400 border-neutral-600/20",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap border ${colors[status] || "bg-neutral-500/10 text-neutral-400 border-neutral-600/20"}`}>{status}</span>
  );
}

export function HealthBar({ segments, title }: { segments: { label: string; value: number; color: string }[]; title: string }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  return (
    <Card>
      <h3 className="text-sm font-medium text-neutral-400 mb-4">{title}</h3>
      <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-white/[0.06]">
        {segments.map(s => s.value > 0 && <div key={s.label} className={s.color} style={{ width: `${Math.round((s.value / total) * 100)}%` }} />)}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {segments.map(s => (
          <div key={s.label} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className={`w-2 h-2 rounded-full ${s.color}`} />
              <span className="text-xs text-neutral-500">{s.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function PipelineBar({ stages, title }: { stages: { label: string; value: number; color: string }[]; title: string }) {
  const max = Math.max(...stages.map(s => s.value), 1);
  return (
    <Card>
      <h3 className="text-sm font-medium text-neutral-400 mb-4">{title}</h3>
      <div className="space-y-3">
        {stages.map(stage => (
          <div key={stage.label} className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 w-24 text-right">{stage.label}</span>
            <div className="flex-1 h-6 bg-white/[0.06] rounded overflow-hidden">
              <div className={`h-full ${stage.color} rounded flex items-center px-2`} style={{ width: `${Math.max((stage.value / max) * 100, 4)}%` }}>
                <span className="text-xs font-medium text-white">{stage.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

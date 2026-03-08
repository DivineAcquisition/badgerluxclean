"use client";

import React, { useState, useEffect, ReactNode } from "react";

// ─── Formatting Helpers ─────────────────────────────

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

function autoFormat(label: string, value: number | string): string {
  if (typeof value === "string") return value;
  const l = label.toLowerCase();
  if (
    /(revenue|margin|mrr|ltv|avg|cost|lost|gap|tips|pay)/.test(l) &&
    !l.includes("%")
  ) {
    return fmtCurrency(value);
  }
  if (/(rate|retention|%|pct)/.test(l)) return fmtPercent(value);
  return fmtNumber(value);
}

// ─── KPICard ────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  color?: string;
  trend?: { value: number; label: string };
}

export function KPICard({ label, value, subtitle, color, trend }: KPICardProps) {
  const formatted = typeof value === "string" ? value : autoFormat(label, value);

  return (
    <div className="flex-1 min-w-[160px] bg-brand-card rounded-lg border-t-[3px] border-brand-gold p-4 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(237,192,44,0.15)] transition-all duration-200">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </p>
      <p
        className="text-[28px] font-bold leading-tight"
        style={{ color: color || "#FFFFFF" }}
      >
        {formatted}
      </p>
      {subtitle && (
        <p className="text-[10px] text-gray-600 mt-1">{subtitle}</p>
      )}
      {trend && (
        <p
          className={`text-[11px] mt-1 ${
            trend.value >= 0 ? "text-brand-green" : "text-brand-red"
          }`}
        >
          {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value).toFixed(1)}%{" "}
          {trend.label}
        </p>
      )}
    </div>
  );
}

// ─── SectionHeader ──────────────────────────────────

interface SectionHeaderProps {
  children: ReactNode;
  icon?: string;
}

export function SectionHeader({ children, icon }: SectionHeaderProps) {
  return (
    <div className="w-full pt-8 pb-3 border-b border-brand-gold/20">
      <h2 className="text-[12px] font-bold text-brand-gold uppercase tracking-[3px]">
        {icon && <span className="mr-2">{icon}</span>}
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

function formatCell(
  val: string | number | null | undefined,
  fmt?: "currency" | "percent" | "number"
): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "string" && !fmt) return val;
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n as number)) return String(val);
  if (fmt === "currency") return fmtCurrency(n as number);
  if (fmt === "percent") return fmtPercent(n as number);
  if (fmt === "number") return fmtNumber(n as number);
  return typeof val === "number" ? fmtNumber(val) : String(val);
}

export function DataTable({ headers, rows, formats }: DataTableProps) {
  return (
    <div className="bg-brand-card rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="bg-brand-table-header border-b-2 border-brand-gold">
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-3 py-2.5 text-[10px] uppercase text-white font-semibold ${
                  i === 0 ? "text-left" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={`border-b border-[#E0E0E0] ${
                ri % 2 === 0 ? "bg-brand-table-even" : "bg-brand-table-odd"
              }`}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2 text-[12px] text-[#333] ${
                    ci === 0 ? "text-left font-bold" : "text-right"
                  }`}
                >
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

interface MonthPickerProps {
  value: string;
  onChange: (v: string) => void;
}

function generateMonths(): string[] {
  const months: string[] = [];
  const names = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  for (let y = 2024; y <= 2028; y++) {
    for (let m = 0; m < 12; m++) {
      months.push(`${names[m]} ${y}`);
    }
  }
  return months;
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#222] text-white border-2 border-brand-gold rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
    >
      <option value="All Time">All Time</option>
      {generateMonths().map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}

// ─── LiveIndicator ──────────────────────────────────

interface LiveIndicatorProps {
  lastSync: string | null;
}

function timeSince(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function LiveIndicator({ lastSync }: LiveIndicatorProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-brand-card border border-brand-gold/30 rounded-md px-4 py-2">
      <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
      <span className="text-brand-gold font-bold text-xs">LIVE</span>
      {lastSync && (
        <span className="text-gray-500 text-xs">{timeSince(lastSync)}</span>
      )}
    </div>
  );
}

// ─── StatusBadge ────────────────────────────────────

interface StatusBadgeProps {
  status: string;
}

const badgeColors: Record<string, string> = {
  Booked: "bg-green-100 text-green-700",
  Active: "bg-green-100 text-green-700",
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  "Not booked": "bg-red-100 text-red-700",
  Cancelled: "bg-red-100 text-red-700",
  Declined: "bg-red-100 text-red-700",
  Ghosted: "bg-gray-200 text-gray-500",
  Invalid: "bg-gray-100 text-gray-400",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls = badgeColors[status] || "bg-gray-100 text-gray-500";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

// ─── SyncButton ─────────────────────────────────────

interface SyncButtonProps {
  onSync: () => Promise<void>;
}

export function SyncButton({ onSync }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<"ok" | "fail" | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      await onSync();
      setResult("ok");
      setTimeout(() => setResult(null), 2000);
    } catch {
      setResult("fail");
      setTimeout(() => setResult(null), 3000);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="flex items-center gap-1.5 px-3 py-2 bg-brand-card text-brand-text text-xs font-medium rounded-md border border-transparent hover:border-brand-gold transition-colors disabled:opacity-50"
    >
      {syncing ? (
        <span className="w-3.5 h-3.5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      ) : result === "ok" ? (
        <span className="text-brand-green">✓</span>
      ) : result === "fail" ? (
        <span className="text-brand-red">✕</span>
      ) : (
        <span>↻</span>
      )}
      {syncing ? "Syncing…" : result === "ok" ? "Synced!" : result === "fail" ? "Failed" : "Sync"}
    </button>
  );
}

// ─── EmptyState ─────────────────────────────────────

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
      <span className="text-3xl mb-3 opacity-30">📭</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Loading Placeholder Cards ──────────────────────

export function KPICardSkeleton() {
  return (
    <div className="flex-1 min-w-[160px] bg-brand-card rounded-lg border-t-[3px] border-brand-gold/30 p-4 animate-pulse">
      <div className="h-2 w-16 bg-gray-700 rounded mb-3" />
      <div className="h-7 w-24 bg-gray-700 rounded" />
    </div>
  );
}

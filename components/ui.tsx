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
  color?: "default" | "green" | "red" | "amber" | "brand";
  trend?: { value: number; label: string };
}

const borderColorMap: Record<string, string> = {
  default: "border-neutral-200",
  green: "border-emerald-200",
  red: "border-red-200",
  amber: "border-amber-200",
  brand: "border-brand/30",
};

const valueColorMap: Record<string, string> = {
  default: "text-white",
  green: "text-emerald-400",
  red: "text-red-400",
  amber: "text-amber-400",
  brand: "text-brand",
};

export function KPICard({
  label,
  value,
  subtitle,
  color = "default",
  trend,
}: KPICardProps) {
  const formatted =
    typeof value === "string" ? value : autoFormat(label, value);

  return (
    <div
      className={`bg-neutral-900 rounded-xl border ${borderColorMap[color]} p-5 shadow-sm hover:shadow-md hover:border-brand/40 transition-all duration-200`}
    >
      <p className="text-sm text-neutral-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColorMap[color]}`}>
        {formatted}
      </p>
      {subtitle && (
        <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
      )}
      {trend && (
        <p
          className={`text-xs mt-1 ${
            trend.value >= 0 ? "text-emerald-400" : "text-red-400"
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
    <div className="mb-4 mt-8 first:mt-0">
      <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {children}
      </h3>
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
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden overflow-x-auto shadow-sm">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-neutral-700">
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-xs text-neutral-400 font-medium ${
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
              className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 transition-colors"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-3 text-sm ${
                    ci === 0
                      ? "text-left text-white font-medium"
                      : "text-right text-neutral-300"
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
      className="bg-neutral-900 text-white border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-brand font-medium text-xs">LIVE</span>
      {lastSync && (
        <span className="text-neutral-500 text-xs">{timeSince(lastSync)}</span>
      )}
    </div>
  );
}

// ─── StatusBadge ────────────────────────────────────

interface StatusBadgeProps {
  status: string;
}

const badgeColors: Record<string, string> = {
  Booked: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Paid: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  "Not booked": "bg-red-500/10 text-red-400 border border-red-500/20",
  Cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
  Declined: "bg-red-500/10 text-red-400 border border-red-500/20",
  Ghosted: "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20",
  Invalid: "bg-neutral-500/10 text-neutral-500 border border-neutral-600/20",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls =
    badgeColors[status] ||
    "bg-neutral-500/10 text-neutral-400 border border-neutral-600/20";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${cls}`}
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
      className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-neutral-300 text-xs font-medium rounded-lg border border-neutral-700 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
    >
      {syncing ? (
        <span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      ) : result === "ok" ? (
        <span className="text-emerald-400">✓</span>
      ) : result === "fail" ? (
        <span className="text-red-400">✕</span>
      ) : (
        <span>↻</span>
      )}
      {syncing
        ? "Syncing…"
        : result === "ok"
        ? "Synced!"
        : result === "fail"
        ? "Failed"
        : "Sync"}
    </button>
  );
}

// ─── EmptyState ─────────────────────────────────────

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Card wrapper ───────────────────────────────────

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-neutral-900 rounded-xl border border-neutral-800 p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ─── HealthBar ──────────────────────────────────────

interface HealthBarProps {
  segments: { label: string; value: number; color: string }[];
  title: string;
}

export function HealthBar({ segments, title }: HealthBarProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  return (
    <Card>
      <h3 className="text-sm font-medium text-neutral-400 mb-4">{title}</h3>
      <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-neutral-800">
        {segments.map(
          (s) =>
            s.value > 0 && (
              <div
                key={s.label}
                className={s.color}
                style={{ width: `${Math.round((s.value / total) * 100)}%` }}
              />
            )
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {segments.map((s) => (
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

// ─── PipelineBar ────────────────────────────────────

interface PipelineStage {
  label: string;
  value: number;
  color: string;
}

export function PipelineBar({
  stages,
  title,
}: {
  stages: PipelineStage[];
  title: string;
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <Card>
      <h3 className="text-sm font-medium text-neutral-400 mb-4">{title}</h3>
      <div className="space-y-3">
        {stages.map((stage) => {
          const width = Math.max((stage.value / max) * 100, 4);
          return (
            <div key={stage.label} className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 w-24 text-right">
                {stage.label}
              </span>
              <div className="flex-1 h-6 bg-neutral-800 rounded overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded flex items-center px-2`}
                  style={{ width: `${width}%` }}
                >
                  <span className="text-xs font-medium text-white">
                    {stage.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Loading ────────────────────────────────────────

export function KPICardSkeleton() {
  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5 animate-pulse">
      <div className="h-3 w-20 bg-neutral-800 rounded mb-3" />
      <div className="h-7 w-28 bg-neutral-800 rounded" />
    </div>
  );
}

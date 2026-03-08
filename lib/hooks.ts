"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import type {
  KPIs,
  MonthlyRow,
  SourceRow,
  VARow,
  RetentionData,
  ObjectionRow,
  Lead,
} from "./supabase";

// ─── Real-time Engine ───────────────────────────────

export function useRealtimeBookings(callback: () => void) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => cbRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

// ─── KPIs ───────────────────────────────────────────

export function useKPIs() {
  const [data, setData] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase
        .from("mv_kpis")
        .select("*")
        .limit(1);
      if (error) throw error;
      setData(rows?.[0] ?? null);
    } catch (e) {
      console.error("useKPIs error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeBookings(refresh);

  return { data, loading, refresh };
}

// ─── Monthly ────────────────────────────────────────

export function useMonthly() {
  const [data, setData] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase
        .from("mv_monthly")
        .select("*")
        .order("month", { ascending: true });
      if (error) throw error;
      setData(rows ?? []);
    } catch (e) {
      console.error("useMonthly error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeBookings(refresh);

  return { data, loading, refresh };
}

// ─── Sources ────────────────────────────────────────

export function useSources() {
  const [data, setData] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase
        .from("mv_sources")
        .select("*")
        .order("total_leads", { ascending: false });
      if (error) throw error;
      setData(rows ?? []);
    } catch (e) {
      console.error("useSources error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeBookings(refresh);

  return { data, loading, refresh };
}

// ─── VA Performance ─────────────────────────────────

export function useVAPerformance() {
  const [data, setData] = useState<VARow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase
        .from("mv_va_performance")
        .select("*")
        .order("total_leads", { ascending: false });
      if (error) throw error;
      setData(rows ?? []);
    } catch (e) {
      console.error("useVAPerformance error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeBookings(refresh);

  return { data, loading, refresh };
}

// ─── Retention ──────────────────────────────────────

export function useRetention() {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase
        .from("mv_retention")
        .select("*")
        .limit(1);
      if (error) throw error;
      setData(rows?.[0] ?? null);
    } catch (e) {
      console.error("useRetention error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeBookings(refresh);

  return { data, loading, refresh };
}

// ─── Objections ─────────────────────────────────────

export function useObjections() {
  const [data, setData] = useState<ObjectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase
        .from("mv_objections")
        .select("*")
        .order("count", { ascending: false });
      if (error) throw error;
      setData(rows ?? []);
    } catch (e) {
      console.error("useObjections error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeBookings(refresh);

  return { data, loading, refresh };
}

// ─── Filtered KPIs (date range) ─────────────────────

export function useFilteredKPIs(
  startDate: string | null,
  endDate: string | null
) {
  const [data, setData] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!startDate || !endDate) {
        const { data: rows, error } = await supabase
          .from("mv_kpis")
          .select("*")
          .limit(1);
        if (error) throw error;
        setData(rows?.[0] ?? null);
      } else {
        const { data: rows, error } = await supabase
          .from("bookings")
          .select(
            "charge_amount, job_cost, margin, frequency, status"
          )
          .gte("booking_date", startDate)
          .lte("booking_date", endDate);

        if (error) throw error;
        if (!rows) {
          setData(null);
          return;
        }

        const total_bookings = rows.length;
        const total_revenue = rows.reduce(
          (s, r) => s + (r.charge_amount || 0),
          0
        );
        const total_cost = rows.reduce((s, r) => s + (r.job_cost || 0), 0);
        const gross_margin = total_revenue - total_cost;
        const margin_pct =
          total_revenue > 0
            ? Math.round((gross_margin / total_revenue) * 1000) / 10
            : 0;
        const avg_job =
          total_bookings > 0
            ? Math.round((total_revenue / total_bookings) * 100) / 100
            : 0;
        const recur_jobs = rows.filter(
          (r) =>
            r.frequency &&
            r.frequency !== "One-Time" &&
            r.frequency !== ""
        ).length;
        const recur_revenue = rows
          .filter(
            (r) =>
              r.frequency &&
              r.frequency !== "One-Time" &&
              r.frequency !== ""
          )
          .reduce((s, r) => s + (r.charge_amount || 0), 0);

        setData({
          total_bookings,
          total_revenue,
          total_cost,
          gross_margin,
          margin_pct,
          avg_job,
          recur_jobs,
          recur_revenue,
        });
      }
    } catch (e) {
      console.error("useFilteredKPIs error:", e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading };
}

// ─── Last Sync ──────────────────────────────────────

export function useLastSync() {
  const [lastSync, setLastSync] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("synced_at")
        .order("synced_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      setLastSync(data?.[0]?.synced_at ?? null);
    } catch (e) {
      console.error("useLastSync error:", e);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeBookings(refresh);

  return lastSync;
}

// ─── Filtered Leads ─────────────────────────────────

export function useFilteredLeads(
  startDate: string | null,
  endDate: string | null
) {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("leads").select("*");
      if (startDate && endDate) {
        query = query.gte("lead_date", startDate).lte("lead_date", endDate);
      }
      const { data: rows, error } = await query;
      if (error) throw error;
      setData(rows ?? []);
    } catch (e) {
      console.error("useFilteredLeads error:", e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading };
}
